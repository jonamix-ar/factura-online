"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ClientInput = {
  name: string;
  address: string;
  zip: string;
  taxId?: string | null;
  email?: string | null;
};

function normalize(input: ClientInput): ClientInput {
  return {
    name: input.name.trim(),
    address: input.address.trim(),
    zip: input.zip.trim(),
    taxId: input.taxId?.trim() || null,
    email: input.email?.trim() || null,
  };
}

export async function createClient(input: ClientInput): Promise<number> {
  const data = normalize(input);
  const created = await prisma.client.create({ data });
  revalidatePath("/clientes");
  revalidatePath("/facturas/nueva");
  return created.id;
}

export async function updateClient(id: number, input: ClientInput) {
  await prisma.client.update({
    where: { id },
    data: normalize(input),
  });
  revalidatePath("/clientes");
  revalidatePath("/facturas/nueva");
}

export async function deleteClient(id: number) {
  // Past invoices keep a snapshot of the client, so deleting only nulls
  // the FK on those rows (ON DELETE SET NULL).
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
  revalidatePath("/facturas/nueva");
}
