import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

// Creates a placeholder default issuer if none exists, so you can boot the
// app for the first time and edit it from /configuracion. Replace the values
// or remove this seed entirely if you'd rather start with an empty DB.

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: path.resolve(process.cwd(), "prisma/dev.db"),
  });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.issuer.count();
  if (existing > 0) {
    console.log(`Ya hay ${existing} emisor(es). Seed omitido.`);
    return;
  }

  await prisma.issuer.create({
    data: {
      name: "Mi Empresa",
      address: "Calle Falsa 123",
      cityZone: "Ciudad, Provincia, País",
      cuit: "00-00000000-0",
      phone: "0000000000",
      email: "facturacion@miempresa.com",
      isDefault: true,
    },
  });

  console.log(
    "Seed listo: emisor placeholder creado. Editalo en /configuracion.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
