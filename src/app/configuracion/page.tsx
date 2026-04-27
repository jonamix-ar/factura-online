import { IssuerManager } from "@/app/configuracion/issuer-manager";
import { prisma } from "@/lib/prisma";

export default async function ConfiguracionPage() {
  const issuers = await prisma.issuer.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los emisores que aparecerán en tus facturas.
        </p>
      </div>
      <IssuerManager
        issuers={issuers.map((i) => ({
          id: i.id,
          name: i.name,
          address: i.address,
          cityZone: i.cityZone,
          cuit: i.cuit,
          phone: i.phone,
          email: i.email,
          isDefault: i.isDefault,
        }))}
      />
    </div>
  );
}
