"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteInvoice, regenerateInvoicePdf } from "@/app/facturas/actions";
import { Button } from "@/components/ui/button";

export function InvoiceActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();

  function onRegenerate() {
    startTransition(async () => {
      try {
        await regenerateInvoicePdf(id);
        toast.success("PDF regenerado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete() {
    if (!confirm("¿Borrar esta factura y su PDF?")) return;
    startTransition(async () => {
      try {
        await deleteInvoice(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled={pending} onClick={onRegenerate}>
        Regenerar PDF
      </Button>
      <Button variant="destructive" disabled={pending} onClick={onDelete}>
        Borrar
      </Button>
    </div>
  );
}
