import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FiltersBar } from "@/app/facturas/filters-bar";
import { PaginationBar } from "@/app/facturas/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

type SearchParams = {
  q?: string;
  issuerId?: string;
  year?: string;
  page?: string;
};

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const issuerIdNum =
    sp.issuerId && sp.issuerId !== "all" ? Number(sp.issuerId) : undefined;
  const yearNum = sp.year && sp.year !== "all" ? Number(sp.year) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Parameters<typeof prisma.invoice.findMany>[0] extends infer T
    ? T extends { where?: infer W }
      ? W
      : never
    : never = {
    ...(q
      ? {
          OR: [
            { clientName: { contains: q } },
            { job: { contains: q } },
            { number: { contains: q } },
          ],
        }
      : {}),
    ...(issuerIdNum ? { issuerId: issuerIdNum } : {}),
    ...(yearNum
      ? {
          date: {
            gte: new Date(Date.UTC(yearNum, 0, 1)),
            lt: new Date(Date.UTC(yearNum + 1, 0, 1)),
          },
        }
      : {}),
  };

  const [invoices, total, allIssuers, allDates] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
    prisma.issuer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.invoice.findMany({ select: { date: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const years = Array.from(
    new Set(allDates.map((d) => d.date.getUTCFullYear())),
  ).sort((a, b) => b - a);

  const totalAmount = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const currencies = Array.from(new Set(invoices.map((i) => i.currency)));
  const totalLabel =
    currencies.length === 1
      ? formatAmount(totalAmount, currencies[0])
      : invoices.length > 0
        ? "varias monedas"
        : "—";

  const hasFilters = q || issuerIdNum !== undefined || yearNum !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            {total} factura{total === 1 ? "" : "s"}
            {hasFilters ? " (filtradas)" : ""} · {totalLabel} en esta página
          </p>
        </div>
        <Button asChild>
          <Link href="/facturas/nueva">+ Nueva factura</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Listado</CardTitle>
          <FiltersBar issuers={allIssuers} years={years} />
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {hasFilters
                ? "Ninguna factura coincide con los filtros."
                : "Todavía no hay facturas. Creá la primera."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">N.º</TableHead>
                  <TableHead className="w-30">Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Trabajo</TableHead>
                  <TableHead className="hidden md:table-cell">Emisor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-15" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, idx) => (
                  <TableRow
                    key={inv.id}
                    className={
                      idx % 2 === 1 ? "bg-muted/30 hover:bg-muted/60" : ""
                    }
                  >
                    <TableCell className="font-mono font-medium">
                      {inv.number}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatDate(inv.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {inv.clientName}
                    </TableCell>
                    <TableCell className="max-w-[18rem] truncate text-muted-foreground">
                      {inv.job}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {inv.issuerName}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatAmount(inv.total, inv.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link href={`/facturas/${inv.id}`}>
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PaginationBar page={page} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
