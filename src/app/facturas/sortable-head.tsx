"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { TableHead } from "@/components/ui/table";

type SortDir = "asc" | "desc";

export function SortableHead({
  column,
  children,
  className,
}: {
  column: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = params.get("sort");
  const currentDir = (params.get("dir") as SortDir) ?? "desc";
  const isActive = currentSort === column;
  const nextDir: SortDir = isActive && currentDir === "desc" ? "asc" : "desc";

  function handleClick() {
    const next = new URLSearchParams(params.toString());
    next.set("sort", column);
    next.set("dir", nextDir);
    next.delete("page");
    startTransition(() => router.push(`/facturas?${next.toString()}`));
  }

  const Icon = isActive
    ? currentDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <Icon className="size-3 text-muted-foreground" />
      </button>
    </TableHead>
  );
}
