"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IssuerOption = { id: number; name: string };

export function FiltersBar({
  issuers,
  years,
}: {
  issuers: IssuerOption[];
  years: number[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const issuerId = params.get("issuerId") ?? "all";
  const year = params.get("year") ?? "all";

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`/facturas?${next.toString()}`);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q });
  }

  function clearAll() {
    setQ("");
    startTransition(() => router.push("/facturas"));
  }

  const hasFilters =
    !!params.get("q") ||
    (params.get("issuerId") && params.get("issuerId") !== "all") ||
    (params.get("year") && params.get("year") !== "all");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form onSubmit={onSearchSubmit} className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por cliente o trabajo…"
          className="pl-8"
          disabled={pending}
        />
      </form>

      <div className="w-full sm:w-52">
        <Select
          value={issuerId}
          onValueChange={(v) => update({ issuerId: v })}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Emisor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los emisores</SelectItem>
            {issuers.map((i) => (
              <SelectItem key={i.id} value={String(i.id)}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-32">
        <Select
          value={year}
          onValueChange={(v) => update({ year: v })}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los años</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={pending}
        >
          <X className="size-4" /> Limpiar
        </Button>
      ) : null}
    </div>
  );
}
