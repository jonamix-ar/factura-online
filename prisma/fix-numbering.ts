import { Database } from "bun:sqlite";

const db = new Database("prisma/dev.db");
const now = new Date().toISOString();

// 1. Rename today's invoice 00001 -> 00008
db.run(
  "UPDATE Invoice SET number = '00008', updatedAt = ? WHERE number = '00001'",
  [now],
);
console.log("Renumerada 00001 -> 00008");

const issuer = db
  .query<{ id: number }, []>("SELECT id FROM Issuer LIMIT 1")
  .get()!;
const client = db
  .query<{ id: number }, []>("SELECT id FROM Client LIMIT 1")
  .get()!;

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
const JOB = "Desarrollo y Programación";
const CONDITIONS =
  "Envio por MoneyGram. CUIT: 20-39239482-7 - ferdus95.fv@gmail.com";

function insertInvoice(number: string, date: string, amount: number) {
  db.run(
    `INSERT INTO Invoice
      (number, date, issuerId, clientId,
       issuerName, issuerAddress, issuerCityZone, issuerCuit, issuerPhone, issuerEmail,
       clientName, clientAddr, clientZip, clientTaxId, clientEmail,
       job, conditions, ivaPercent, subtotal, total, currency, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'USD', ?, ?)`,
    [
      number,
      date,
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
      JOB,
      CONDITIONS,
      amount,
      amount,
      now,
      now,
    ],
  );
  const { id } = db
    .query<{ id: number }, []>("SELECT id FROM Invoice WHERE number = ?")
    .get(number)!;
  db.run(
    "INSERT INTO InvoiceItem (invoiceId, description, amount, position) VALUES (?, ?, ?, 0)",
    [id, "Servicios de Desarrollo y Programación", amount],
  );
  console.log(`Creada ${number} — ${date} — ${amount} USD`);
}

// 2. Insert missing invoices
insertInvoice("00001", "2025-10-03", 330);
insertInvoice("00007", "2026-03-31", 300);

// Verify final state
console.log("\nEstado final:");
const all = db
  .query<{ number: string; date: string; total: number }, []>(
    "SELECT number, date, total FROM Invoice ORDER BY number",
  )
  .all();
for (const r of all) console.log(`  ${r.number}  ${r.date}  ${r.total} USD`);

db.close();
