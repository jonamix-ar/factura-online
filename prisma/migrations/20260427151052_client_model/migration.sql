-- Client model migration. Adds Client table, links Invoice.clientId,
-- and backfills by deduplicating existing client snapshots from invoices.

-- 1) Create Client table
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 2) Backfill Client rows by deduplicating distinct client snapshots
--    from existing invoices. NULL taxId/email are normalized to empty string
--    for the GROUP BY so rows with the same business identity collapse.
INSERT INTO "Client" ("name", "address", "zip", "taxId", "email", "createdAt", "updatedAt")
SELECT
    "clientName",
    "clientAddr",
    "clientZip",
    NULLIF("clientTaxId", ''),
    NULLIF("clientEmail", ''),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT
        "clientName",
        "clientAddr",
        "clientZip",
        IFNULL("clientTaxId", '') AS "clientTaxId",
        IFNULL("clientEmail", '') AS "clientEmail"
    FROM "Invoice"
);

-- 3) Recreate Invoice with clientId FK
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuerId" INTEGER,
    "clientId" INTEGER,
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
    CONSTRAINT "Invoice_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4) Copy invoices and link clientId by matching the snapshot fields back to Client.
INSERT INTO "new_Invoice" (
    "id", "number", "date", "issuerId", "clientId",
    "issuerName", "issuerAddress", "issuerCityZone", "issuerCuit", "issuerPhone", "issuerEmail",
    "clientName", "clientAddr", "clientZip", "clientTaxId", "clientEmail",
    "job", "conditions", "ivaPercent", "subtotal", "total", "currency", "pdfPath",
    "createdAt", "updatedAt"
)
SELECT
    inv."id", inv."number", inv."date", inv."issuerId",
    (
        SELECT cl."id" FROM "Client" cl
        WHERE cl."name" = inv."clientName"
          AND cl."address" = inv."clientAddr"
          AND cl."zip" = inv."clientZip"
          AND IFNULL(cl."taxId", '') = IFNULL(inv."clientTaxId", '')
          AND IFNULL(cl."email", '') = IFNULL(inv."clientEmail", '')
        LIMIT 1
    ) AS "clientId",
    inv."issuerName", inv."issuerAddress", inv."issuerCityZone", inv."issuerCuit", inv."issuerPhone", inv."issuerEmail",
    inv."clientName", inv."clientAddr", inv."clientZip", inv."clientTaxId", inv."clientEmail",
    inv."job", inv."conditions", inv."ivaPercent", inv."subtotal", inv."total", inv."currency", inv."pdfPath",
    inv."createdAt", inv."updatedAt"
FROM "Invoice" inv;

DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
