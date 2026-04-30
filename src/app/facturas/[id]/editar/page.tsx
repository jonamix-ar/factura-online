import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/app/facturas/_components/invoice-form";
import { prisma } from "@/lib/prisma";

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const [invoice, issuers, clients] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { items: { orderBy: { position: "asc" } } },
    }),
    prisma.issuer.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!invoice) notFound();

  // If the original issuer was deleted, fall back to the default so the
  // <Select> has a valid value. The user can pick any issuer before saving.
  const fallbackIssuerId =
    invoice.issuerId ?? issuers.find((i) => i.isDefault)?.id ?? issuers[0]?.id;

  if (issuers.length === 0 || fallbackIssuerId == null) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Editar factura N.º {invoice.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          No hay emisores cargados. Creá uno desde{" "}
          <Link href="/configuracion" className="underline">
            Configuración
          </Link>{" "}
          y volvé.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/facturas/${invoice.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver al detalle
        </Link>
        <h1 className="text-2xl font-semibold">
          Editar factura N.º {invoice.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Al guardar, el PDF se regenera automáticamente.
        </p>
      </div>

      <InvoiceForm
        mode="edit"
        issuers={issuers.map((i) => ({
          id: i.id,
          name: i.name,
          cuit: i.cuit,
          isDefault: i.isDefault,
        }))}
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          zip: c.zip,
          taxId: c.taxId,
          email: c.email,
        }))}
        initial={{
          id: invoice.id,
          issuerId: fallbackIssuerId,
          clientId: invoice.clientId,
          date: invoice.date.toISOString().slice(0, 10),
          clientName: invoice.clientName,
          clientAddr: invoice.clientAddr,
          clientZip: invoice.clientZip,
          clientTaxId: invoice.clientTaxId ?? "",
          clientEmail: invoice.clientEmail ?? "",
          job: invoice.job,
          conditions: invoice.conditions,
          ivaPercent: String(invoice.ivaPercent),
          currency: invoice.currency,
          items: invoice.items.map((it) => ({
            description: it.description,
            amount: String(it.amount),
          })),
        }}
      />
    </div>
  );
}
