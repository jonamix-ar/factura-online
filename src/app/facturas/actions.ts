"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatInvoiceNumber } from "@/lib/format";
import { deleteInvoicePdf, renderInvoicePdfToFile } from "@/lib/pdf/render";
import { prisma } from "@/lib/prisma";

type CreateInvoiceItem = {
  description: string;
  amount: number;
};

type CreateInvoiceInput = {
  issuerId: number;
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
  const result = await prisma.$transaction(async (tx) => {
    const [{ maxNumber }] = await tx.$queryRaw<[{ maxNumber: string | null }]>`SELECT MAX(CAST(number AS INTEGER)) as maxNumber FROM Invoice`;
    const lastN = maxNumber ? Number(maxNumber) : 0;
    return formatInvoiceNumber(lastN + 1);
  });
  return result;
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
  const date = new Date(input.date);

  let invoice;
  let attempts = 0;

  while (!invoice && attempts < 5) {
    if (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    }
    attempts++;

    const number = await nextInvoiceNumber();

    try {
      invoice = await prisma.invoice.create({
        include: { items: true },
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
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("Unique constraint failed")
      ) {
        continue;
      }
      throw e;
    }
  }

  if (!invoice) {
    throw new Error("No se pudo crear la factura después de varios intentos.");
  }

  const { publicPath } = await renderInvoicePdfToFile({
    issuer: {
      name: issuer.name,
      address: issuer.address,
      cityZone: issuer.cityZone,
      cuit: issuer.cuit,
      phone: issuer.phone,
      email: issuer.email,
    },
    number: invoice.number,
    date: invoice.date,
    client: {
      name: snapshot.name,
      address: snapshot.address,
      zip: snapshot.zip,
      taxId: snapshot.taxId,
      email: snapshot.email,
    },
    job: input.job,
    conditions: input.conditions,
    ivaPercent: input.ivaPercent,
    subtotal,
    total,
    currency: input.currency,
    items: invoice.items.map((it) => ({
      description: it.description,
      amount: it.amount,
    })),
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfPath: publicPath },
  });

  revalidatePath("/facturas");
  redirect(`/facturas/${invoice.number}`);
}

export async function updateInvoice(
  id: number,
  input: Omit<CreateInvoiceInput, "items"> & { items: CreateInvoiceItem[] }
) {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) throw new Error("Factura no encontrada.");

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
  const date = new Date(input.date);

  await prisma.invoiceItem.deleteMany({
    where: { invoiceId: id },
  });

  const invoice = await prisma.invoice.update({
    include: { items: true },
    where: { id },
    data: {
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

  if (existing.pdfPath) {
    await deleteInvoicePdf(existing.pdfPath);
  }

  const { publicPath } = await renderInvoicePdfToFile({
    issuer: {
      name: issuer.name,
      address: issuer.address,
      cityZone: issuer.cityZone,
      cuit: issuer.cuit,
      phone: issuer.phone,
      email: issuer.email,
    },
    number: invoice.number,
    date: invoice.date,
    client: {
      name: snapshot.name,
      address: snapshot.address,
      zip: snapshot.zip,
      taxId: snapshot.taxId,
      email: snapshot.email,
    },
    job: input.job,
    conditions: input.conditions,
    ivaPercent: input.ivaPercent,
    subtotal,
    total,
    currency: input.currency,
    items: invoice.items.map((it) => ({
      description: it.description,
      amount: it.amount,
    })),
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfPath: publicPath },
  });

  revalidatePath("/facturas");
  redirect(`/facturas/${invoice.number}`);
}

export async function deleteInvoice(id: number) {
  const existing = await prisma.invoice.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Factura no encontrada.");

  if (existing.pdfPath) {
    await deleteInvoicePdf(existing.pdfPath);
  }

  await prisma.invoice.delete({
    where: { id },
  });

  revalidatePath("/facturas");
}

export async function regenerateInvoicePdf(id: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) throw new Error("Factura no encontrada.");

  const issuer = await prisma.issuer.findUnique({
    where: { id: invoice.issuerId ?? undefined },
  });
  if (!issuer) throw new Error("Emisor no encontrado.");

  if (invoice.pdfPath) {
    await deleteInvoicePdf(invoice.pdfPath);
  }

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
      taxId: invoice.clientTaxId ?? undefined,
      email: invoice.clientEmail ?? undefined,
    },
    job: invoice.job,
    conditions: invoice.conditions,
    ivaPercent: invoice.ivaPercent,
    subtotal: invoice.subtotal,
    total: invoice.total,
    currency: invoice.currency,
    items: invoice.items.map((it) => ({
      description: it.description,
      amount: it.amount,
    })),
  });

  await prisma.invoice.update({
    where: { id },
    data: { pdfPath: publicPath },
  });

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
}