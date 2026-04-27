"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PaginationBar({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    startTransition(() => {
      router.push(`/facturas?${next.toString()}`);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={pending || page <= 1}
        >
          <ChevronLeft className="size-4" /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={pending || page >= totalPages}
        >
          Siguiente <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
