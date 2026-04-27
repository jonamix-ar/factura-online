-- Multi-issuer migration with data preservation.
-- Issuer gets autoincrement PK + isDefault/createdAt; Invoice gets required issuerId
-- (existing rows are backfilled to the first issuer in the table).

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- 1) Recreate Issuer with autoincrement PK + new columns
CREATE TABLE "new_Issuer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cityZone" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Issuer" ("id", "name", "address", "cityZone", "cuit", "phone", "email", "updatedAt", "isDefault")
  SELECT "id", "name", "address", "cityZone", "cuit", "phone", "email", "updatedAt", 1 FROM "Issuer";
DROP TABLE "Issuer";
ALTER TABLE "new_Issuer" RENAME TO "Issuer";

-- 2) Recreate Invoice with required issuerId, backfilled from the first existing issuer.
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuerId" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientAddr" TEXT NOT NULL,
    "clientZip" TEXT NOT NULL,
    "clientTaxId" TEXT,
    "clientEmail" TEXT,
    "job" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "ivaPercent" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice"
  ("id", "number", "date", "issuerId", "clientName", "clientAddr", "clientZip", "clientTaxId", "clientEmail", "job", "conditions", "ivaPercent", "subtotal", "total", "currency", "pdfPath", "createdAt", "updatedAt")
  SELECT
    "id", "number", "date",
    COALESCE((SELECT "id" FROM "Issuer" ORDER BY "id" ASC LIMIT 1), 1) AS "issuerId",
    "clientName", "clientAddr", "clientZip", "clientTaxId", "clientEmail",
    "job", "conditions", "ivaPercent", "subtotal", "total", "currency", "pdfPath", "createdAt", "updatedAt"
  FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
