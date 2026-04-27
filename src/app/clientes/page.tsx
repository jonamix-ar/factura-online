import { ClientsManager } from "@/app/clientes/clients-manager";
import { prisma } from "@/lib/prisma";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { invoices: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo reutilizable. Las facturas guardan una copia congelada al
          emitir, así que editar un cliente no afecta las facturas pasadas.
        </p>
      </div>
      <ClientsManager
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          zip: c.zip,
          taxId: c.taxId,
          email: c.email,
          invoiceCount: c._count.invoices,
        }))}
      />
    </div>
  );
}
