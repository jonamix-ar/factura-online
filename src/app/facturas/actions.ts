"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatInvoiceNumber } from "@/lib/format";
import {
  deleteInvoicePdf,
  renderInvoicePdfToFile,
} from "@/lib/pdf/render";
import { prisma } from "@/lib/prisma";

type CreateInvoiceItem = {
  description: string;
  amount: number;
};

type CreateInvoiceInput = {
  issuerId: number;
  // If clientId is provided, the snapshot fields below are ignored and
  // taken from the Client record. If it's null, a new Client is created
  // from the snapshot fields.
  clientId: number | null;
  date: string;
  clientName: string;
  clientAddr: string;
  clientZip: string;
  clientTaxId?: string | null;
  clientEmail?: string | null;
  job: string;
  conditions: string;
  ivaPercent: number;
  currency: string;
  items: CreateInvoiceItem[];
};

async function nextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({
    orderBy: { id: "desc" },
    select: { number: true },
  });
  const lastN = last ? Number(last.number) : 0;
  return formatInvoiceNumber(lastN + 1);
}

export async function createInvoice(input: CreateInvoiceInput) {
  const items = input.items
    .map((it) => ({
      description: it.description.trim(),
      amount: Number(it.amount),
    }))
    .filter((it) => it.description.length > 0 && Number.isFinite(it.amount));

  if (items.length === 0) {
    throw new Error("La factura necesita al menos un ítem.");
  }

  const issuer = await prisma.issuer.findUnique({
    where: { id: input.issuerId },
  });
  if (!issuer) throw new Error("El emisor seleccionado no existe.");

  // Resolve client: either pick the existing one or create a new one from
  // the snapshot fields. The Invoice always carries its own snapshot copy
  // (clientName/Addr/Zip/TaxId/Email) regardless.
  let clientId: number | null = null;
  let snapshot = {
    name: input.clientName.trim(),
    address: input.clientAddr.trim(),
    zip: input.clientZip.trim(),
    taxId: input.clientTaxId?.trim() || null,
    email: input.clientEmail?.trim() || null,
  };

  if (input.clientId) {
    const existing = await prisma.client.findUnique({
      where: { id: input.clientId },
    });
    if (!existing) throw new Error("El cliente seleccionado no existe.");
    clientId = existing.id;
    snapshot = {
      name: existing.name,
      address: existing.address,
      zip: existing.zip,
      taxId: existing.taxId,
      email: existing.email,
    };
  } else {
    const created = await prisma.client.create({ data: snapshot });
    clientId = created.id;
  }

  const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
  const total = subtotal * (1 + input.ivaPercent / 100);
  const number = await nextInvoiceNumber();
  const date = new Date(input.date);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      date,
      issuerId: issuer.id,
      clientId,
      issuerName: issuer.name,
      issuerAddress: issuer.address,
      issuerCityZone: issuer.cityZone,
      issuerCuit: issuer.cuit,
      issuerPhone: issuer.phone,
      issuerEmail: issuer.email,
      clientName: snapshot.name,
      clientAddr: snapshot.address,
      clientZip: snapshot.zip,
      clientTaxId: snapshot.taxId,
      clientEmail: snapshot.email,
      job: input.job,
      conditions: input.conditions,
      ivaPercent: input.ivaPercent,
      subtotal,
      total,
      currency: input.currency,
      items: {
        create: items.map((it, position) => ({
          description: it.description,
          amount: it.amount,
          position,
        })),
      },
    },
  });

  const { publicPath } = await renderInvoicePdfToFile({
    issuer: {
      name: issuer.name,
      address: issuer.address,
      cityZone: issuer.cityZone,
      cuit: issuer.cuit,
      phone: issuer.phone,
      email: issuer.email,
    },
    number,
    date,
    client: {
      name: snapshot.name,
      address: snapshot.address,
      zip: snapshot.zip,
      taxId: snapshot.taxId,
      email: snapshot.email,
    },
    job: input.job,
    conditions: input.conditions,
    items,
    ivaPercent: input.ivaPercent,
    subtotal,
    total,
    currency: input.currency,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfPath: publicPath },
  });

  revalidatePath("/facturas");
  redirect(`/facturas/${invoice.id}`);
}

export async function deleteInvoice(id: number) {
  const inv = await prisma.invoice.findUnique({
    where: { id },
    select: { number: true },
  });
  if (!inv) return;
  await deleteInvoicePdf(inv.number);
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/facturas");
  redirect("/facturas");
}

export async function regenerateInvoicePdf(id: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!invoice) throw new Error("Factura no encontrada.");

  const { publicPath } = await renderInvoicePdfToFile({
    issuer: {
      name: invoice.issuerName,
      address: invoice.issuerAddress,
      cityZone: invoice.issuerCityZone,
      cuit: invoice.issuerCuit,
      phone: invoice.issuerPhone,
      email: invoice.issuerEmail,
    },
    number: invoice.number,
    date: invoice.date,
    client: {
      name: invoice.clientName,
      address: invoice.clientAddr,
      zip: invoice.clientZip,
      taxId: invoice.clientTaxId,
      email: invoice.clientEmail,
    },
    job: invoice.job,
    conditions: invoice.conditions,
    items: invoice.items.map((i) => ({
      description: i.description,
      amount: i.amount,
    })),
    ivaPercent: invoice.ivaPercent,
    subtotal: invoice.subtotal,
    total: invoice.total,
    currency: invoice.currency,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfPath: publicPath },
  });
  revalidatePath(`/facturas/${invoice.id}`);
}
