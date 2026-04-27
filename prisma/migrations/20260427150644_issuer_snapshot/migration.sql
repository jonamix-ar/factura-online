-- Issuer snapshot migration: each Invoice freezes a copy of the Issuer
-- as it was at emission time. issuerId becomes nullable (ON DELETE SET NULL)
-- so an Issuer can be removed without losing past invoices.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuerId" INTEGER,
    "issuerName" TEXT NOT NULL,
    "issuerAddress" TEXT NOT NULL,
    "issuerCityZone" TEXT NOT NULL,
    "issuerCuit" TEXT NOT NULL,
    "issuerPhone" TEXT NOT NULL,
    "issuerEmail" TEXT NOT NULL,
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
    CONSTRAINT "Invoice_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Backfill snapshot fields from the related Issuer at the time of migration.
INSERT INTO "new_Invoice" (
    "id", "number", "date", "issuerId",
    "issuerName", "issuerAddress", "issuerCityZone", "issuerCuit", "issuerPhone", "issuerEmail",
    "clientName", "clientAddr", "clientZip", "clientTaxId", "clientEmail",
    "job", "conditions", "ivaPercent", "subtotal", "total", "currency", "pdfPath",
    "createdAt", "updatedAt"
)
SELECT
    inv."id", inv."number", inv."date", inv."issuerId",
    COALESCE(iss."name", 'Emisor desconocido'),
    COALESCE(iss."address", ''),
    COALESCE(iss."cityZone", ''),
    COALESCE(iss."cuit", ''),
    COALESCE(iss."phone", ''),
    COALESCE(iss."email", ''),
    inv."clientName", inv."clientAddr", inv."clientZip", inv."clientTaxId", inv."clientEmail",
    inv."job", inv."conditions", inv."ivaPercent", inv."subtotal", inv."total", inv."currency", inv."pdfPath",
    inv."createdAt", inv."updatedAt"
FROM "Invoice" inv
LEFT JOIN "Issuer" iss ON iss."id" = inv."issuerId";

DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
