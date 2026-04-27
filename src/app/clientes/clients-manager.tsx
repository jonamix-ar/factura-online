"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type ClientInput,
  createClient,
  deleteClient,
  updateClient,
} from "@/app/clientes/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Client = ClientInput & {
  id: number;
  invoiceCount: number;
};

const empty: ClientInput = {
  name: "",
  address: "",
  zip: "",
  taxId: "",
  email: "",
};

export function ClientsManager({ clients }: { clients: Client[] }) {
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(
    clients[0] ? String(clients[0].id) : "new",
  );

  const isNew = selectedId === "new";
  const current = isNew
    ? null
    : (clients.find((c) => String(c.id) === selectedId) ?? null);

  const [form, setForm] = useState<ClientInput>(current ?? empty);

  function selectId(value: string) {
    setSelectedId(value);
    if (value === "new") {
      setForm(empty);
    } else {
      const found = clients.find((c) => String(c.id) === value);
      if (found) {
        setForm({
          name: found.name,
          address: found.address,
          zip: found.zip,
          taxId: found.taxId ?? "",
          email: found.email ?? "",
        });
      }
    }
  }

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isNew) {
          await createClient(form);
          toast.success("Cliente creado");
          setSelectedId("new");
          setForm(empty);
        } else if (current) {
          await updateClient(current.id, form);
          toast.success("Cliente actualizado");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete() {
    if (!current) return;
    const usage =
      current.invoiceCount > 0
        ? ` Tiene ${current.invoiceCount} factura(s) asociadas (mantendrán su copia de los datos).`
        : "";
    if (!confirm(`¿Borrar el cliente "${current.name}"?${usage}`)) return;
    startTransition(async () => {
      try {
        await deleteClient(current.id);
        toast.success("Cliente borrado");
        setSelectedId("new");
        setForm(empty);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cliente activo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="client-select">Seleccionar cliente</Label>
            <Select value={selectedId} onValueChange={selectId}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Elegir cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.invoiceCount > 0 ? ` · ${c.invoiceCount} facts` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Nuevo cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {current ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="size-4" /> Borrar cliente
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Nuevo cliente" : "Editar cliente"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Razón social</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">Código postal / ciudad</Label>
              <Input
                id="zip"
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxId">CIF / CUIT / RUT</Label>
              <Input
                id="taxId"
                value={form.taxId ?? ""}
                onChange={(e) => set("taxId", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando…"
              : isNew
                ? "Crear cliente"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {clients.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Todos los clientes ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground">
                    {c.taxId ?? "—"} · {c.invoiceCount} factura
                    {c.invoiceCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectId(String(c.id))}
                >
                  Editar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
