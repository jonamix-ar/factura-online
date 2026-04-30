/**
 * Seeds the 6 historical invoices (#00001–#00006) for VERDUS MARTINEZ / Comparen SRL.
 * Run with: bun prisma/seed-history.ts
 */
import { Database } from "bun:sqlite";
import path from "node:path";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl;
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

const db = new Database(absolutePath);

const ISSUER = {
  name: "VERDUS MARTINEZ, LUIS FERNANDO",
  address: "Buchardo 1103",
  cityZone: "1718, San Antonio de Padua, Buenos Aires, Argentina",
  cuit: "20-39239482-7",
  phone: "5491139530561",
  email: "ferdus95.fv@gmail.com",
};

const CLIENT = {
  name: "Comparen SRL",
  address: "Calle Altair 4",
  zip: "38111",
  taxId: "B05449731",
  email: "emilio.garcia@avanzando.es",
};

const INVOICES = [
  { number: "00001", date: "2025-10-03", amount: 330 },
  { number: "00002", date: "2025-10-31", amount: 300 },
  { number: "00003", date: "2025-11-28", amount: 300 },
  { number: "00004", date: "2025-12-31", amount: 300 },
  { number: "00005", date: "2026-01-31", amount: 300 },
  { number: "00006", date: "2026-02-27", amount: 300 },
];

const now = new Date().toISOString();

// Find or create issuer
let issuer = db
  .query<{ id: number; name: string }, []>(
    "SELECT id, name FROM Issuer WHERE cuit = ?",
  )
  .get(ISSUER.cuit);
if (!issuer) {
  db.run(
    "INSERT INTO Issuer (name, address, cityZone, cuit, phone, email, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
    [
      ISSUER.name,
      ISSUER.address,
      ISSUER.cityZone,
      ISSUER.cuit,
      ISSUER.phone,
      ISSUER.email,
      now,
      now,
    ],
  );
  issuer = db
    .query<{ id: number; name: string }, []>(
      "SELECT id, name FROM Issuer WHERE cuit = ?",
    )
    .get(ISSUER.cuit)!;
  console.log(`Emisor creado: ${issuer.name} (id=${issuer.id})`);
} else {
  console.log(`Emisor encontrado: ${issuer.name} (id=${issuer.id})`);
}

// Find or create client
let client = db
  .query<{ id: number; name: string }, []>(
    "SELECT id, name FROM Client WHERE taxId = ?",
  )
  .get(CLIENT.taxId);
if (!client) {
  db.run(
    "INSERT INTO Client (name, address, zip, taxId, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      CLIENT.name,
      CLIENT.address,
      CLIENT.zip,
      CLIENT.taxId,
      CLIENT.email,
      now,
      now,
    ],
  );
  client = db
    .query<{ id: number; name: string }, []>(
      "SELECT id, name FROM Client WHERE taxId = ?",
    )
    .get(CLIENT.taxId)!;
  console.log(`Cliente creado: ${client.name} (id=${client.id})`);
} else {
  console.log(`Cliente encontrado: ${client.name} (id=${client.id})`);
}

// Insert invoices
for (const inv of INVOICES) {
  const exists = db
    .query("SELECT id FROM Invoice WHERE number = ?")
    .get(inv.number);
  if (exists) {
    console.log(`Factura #${inv.number} ya existe, saltando.`);
    continue;
  }

  db.run(
    `INSERT INTO Invoice
      (number, date, issuerId, clientId,
       issuerName, issuerAddress, issuerCityZone, issuerCuit, issuerPhone, issuerEmail,
       clientName, clientAddr, clientZip, clientTaxId, clientEmail,
       job, conditions, ivaPercent, subtotal, total, currency, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'USD', ?, ?)`,
    [
      inv.number,
      inv.date,
      issuer.id,
      client.id,
      ISSUER.name,
      ISSUER.address,
      ISSUER.cityZone,
      ISSUER.cuit,
      ISSUER.phone,
      ISSUER.email,
      CLIENT.name,
      CLIENT.address,
      CLIENT.zip,
      CLIENT.taxId,
      CLIENT.email,
      "Desarrollo y Programación",
      "Envio por MoneyGram. CUIT: 20-39239482-7 - ferdus95.fv@gmail.com",
      inv.amount,
      inv.amount,
      now,
      now,
    ],
  );

  const inserted = db
    .query<{ id: number }, []>("SELECT id FROM Invoice WHERE number = ?")
    .get(inv.number)!;
  db.run(
    "INSERT INTO InvoiceItem (invoiceId, description, amount, position) VALUES (?, ?, ?, 0)",
    [inserted.id, "Servicios de Desarrollo y Programación", inv.amount],
  );

  console.log(
    `Factura #${inv.number} creada — ${inv.date} — ${inv.amount} USD`,
  );
}

db.close();
console.log("\nListo.");
