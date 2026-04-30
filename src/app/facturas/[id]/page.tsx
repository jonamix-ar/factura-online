import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceActions } from "@/app/facturas/[id]/invoice-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatAmount, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: numberParam } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { number: numberParam },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/facturas"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Volver al listado
          </Link>
          <h1 className="font-heading text-2xl font-semibold">
            Factura N.º {invoice.number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(invoice.date)} · {invoice.clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.pdfPath ? (
            <Button asChild variant="outline">
              <a href={invoice.pdfPath} download={`${invoice.number}.pdf`}>
                Descargar PDF
              </a>
            </Button>
          ) : null}
          <InvoiceActions id={invoice.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Emisor</p>
              <p className="font-medium">{invoice.issuerName}</p>
              <p className="text-muted-foreground">CUIT {invoice.issuerCuit}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{invoice.clientName}</p>
              <p>{invoice.clientAddr}</p>
              <p>{invoice.clientZip}</p>
              {invoice.clientTaxId ? <p>{invoice.clientTaxId}</p> : null}
              {invoice.clientEmail ? (
                <p className="text-blue-600">{invoice.clientEmail}</p>
              ) : null}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground">Trabajo</p>
              <p>{invoice.job}</p>
            </div>
            {invoice.conditions ? (
              <div>
                <p className="text-muted-foreground">Condiciones</p>
                <p className="whitespace-pre-line">{invoice.conditions}</p>
              </div>
            ) : null}
            <Separator />
            <div className="space-y-1">
              {invoice.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.description}</span>
                  <span className="font-mono">
                    {formatAmount(it.amount, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatAmount(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  IVA ({invoice.ivaPercent}%)
                </span>
                <span>
                  {formatAmount(
                    invoice.total - invoice.subtotal,
                    invoice.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatAmount(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Vista previa PDF</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoice.pdfPath ? (
              <iframe
                title={`Factura ${invoice.number}`}
                src={invoice.pdfPath}
                className="h-[900px] w-full border-0"
              />
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                El PDF aún no fue generado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
