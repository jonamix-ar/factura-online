import Link from "next/link";
import { NewInvoiceForm } from "@/app/facturas/nueva/new-invoice-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function NuevaFacturaPage() {
  const [issuers, clients] = await Promise.all([
    prisma.issuer.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (issuers.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nueva factura</h1>
        <Card>
          <CardHeader>
            <CardTitle>Necesitás un emisor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Antes de crear facturas tenés que dar de alta al menos un emisor
              en Configuración.
            </p>
            <Button asChild>
              <Link href="/configuracion">Ir a configuración</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva factura</h1>
      <NewInvoiceForm
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
      />
    </div>
  );
}
