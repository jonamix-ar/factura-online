"use client";

import { Star, StarOff, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createIssuer,
  deleteIssuer,
  type IssuerInput,
  setDefaultIssuer,
  updateIssuer,
} from "@/app/configuracion/actions";
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
import { Separator } from "@/components/ui/separator";

type Issuer = IssuerInput & {
  id: number;
  isDefault: boolean;
};

const empty: IssuerInput = {
  name: "",
  address: "",
  cityZone: "",
  cuit: "",
  phone: "",
  email: "",
};

export function IssuerManager({ issuers }: { issuers: Issuer[] }) {
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(
    issuers[0] ? String(issuers[0].id) : "new",
  );

  const isNew = selectedId === "new";
  const current = isNew
    ? null
    : (issuers.find((i) => String(i.id) === selectedId) ?? null);

  const [form, setForm] = useState<IssuerInput>(current ?? empty);

  function selectId(value: string) {
    setSelectedId(value);
    if (value === "new") {
      setForm(empty);
    } else {
      const found = issuers.find((i) => String(i.id) === value);
      if (found) {
        setForm({
          name: found.name,
          address: found.address,
          cityZone: found.cityZone,
          cuit: found.cuit,
          phone: found.phone,
          email: found.email,
        });
      }
    }
  }

  function set<K extends keyof IssuerInput>(key: K, value: IssuerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isNew) {
          await createIssuer(form);
          toast.success("Emisor creado");
          setSelectedId("new");
          setForm(empty);
        } else if (current) {
          await updateIssuer(current.id, form);
          toast.success("Cambios guardados");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete() {
    if (!current) return;
    if (!confirm(`¿Borrar el emisor "${current.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteIssuer(current.id);
        toast.success("Emisor borrado");
        setSelectedId("new");
        setForm(empty);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onSetDefault() {
    if (!current) return;
    startTransition(async () => {
      try {
        await setDefaultIssuer(current.id);
        toast.success(`"${current.name}" es el emisor predeterminado`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Emisor activo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="issuer-select">Seleccionar usuario / emisor</Label>
            <Select value={selectedId} onValueChange={selectId}>
              <SelectTrigger id="issuer-select">
                <SelectValue placeholder="Elegir emisor" />
              </SelectTrigger>
              <SelectContent>
                {issuers.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name}
                    {i.isDefault ? " · predeterminado" : ""}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Nuevo emisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {current ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending || current.isDefault}
                onClick={onSetDefault}
              >
                {current.isDefault ? (
                  <>
                    <Star className="size-4 fill-current" /> Predeterminado
                  </>
                ) : (
                  <>
                    <StarOff className="size-4" /> Marcar como predeterminado
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={onDelete}
              >
                <Trash2 className="size-4" /> Borrar emisor
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{isNew ? "Nuevo emisor" : "Editar emisor"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre / Razón social</Label>
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cityZone">Localidad / Provincia / País</Label>
              <Input
                id="cityZone"
                value={form.cityZone}
                onChange={(e) => set("cityZone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={form.cuit}
                onChange={(e) => set("cuit", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Guardando…"
              : isNew
                ? "Crear emisor"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {issuers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Todos los emisores ({issuers.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {issuers.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {i.name}
                    {i.isDefault ? (
                      <span className="ml-2 text-xs text-primary">
                        ★ predeterminado
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">
                    CUIT {i.cuit} · {i.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectId(String(i.id))}
                >
                  Editar
                </Button>
              </div>
            ))}
            <Separator className="my-1" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
