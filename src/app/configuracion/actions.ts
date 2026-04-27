"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type IssuerInput = {
  name: string;
  address: string;
  cityZone: string;
  cuit: string;
  phone: string;
  email: string;
};

export async function createIssuer(input: IssuerInput) {
  const count = await prisma.issuer.count();
  await prisma.issuer.create({
    data: { ...input, isDefault: count === 0 },
  });
  revalidatePath("/configuracion");
  revalidatePath("/facturas/nueva");
}

export async function updateIssuer(id: number, input: IssuerInput) {
  await prisma.issuer.update({
    where: { id },
    data: input,
  });
  revalidatePath("/configuracion");
  revalidatePath("/facturas/nueva");
}

export async function deleteIssuer(id: number) {
  // Past invoices keep a snapshot of the issuer, so deleting an Issuer
  // record only nulls the FK on those rows (ON DELETE SET NULL).
  await prisma.issuer.delete({ where: { id } });
  revalidatePath("/configuracion");
  revalidatePath("/facturas/nueva");
}

export async function setDefaultIssuer(id: number) {
  await prisma.$transaction([
    prisma.issuer.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    }),
    prisma.issuer.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/configuracion");
  revalidatePath("/facturas/nueva");
}
