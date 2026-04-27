import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";

type InvoicePdfArgs = Parameters<typeof InvoicePdf>[0];

const PUBLIC_DIR = path.join(process.cwd(), "public", "invoice");

export async function renderInvoicePdfToFile(args: InvoicePdfArgs): Promise<{
  fileName: string;
  publicPath: string;
}> {
  const buffer = await renderToBuffer(InvoicePdf(args) as React.ReactElement);
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const fileName = `${args.number}.pdf`;
  await fs.writeFile(path.join(PUBLIC_DIR, fileName), buffer);
  return { fileName, publicPath: `/invoice/${fileName}` };
}

export async function deleteInvoicePdf(number: string): Promise<void> {
  const file = path.join(PUBLIC_DIR, `${number}.pdf`);
  try {
    await fs.unlink(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
