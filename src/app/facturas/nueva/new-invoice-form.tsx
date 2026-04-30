"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createInvoice } from "@/app/facturas/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/currencies";

type IssuerOption = {
  id: number;
  name: string;
  cuit: string;
  isDefault: boolean;
};

type ClientOption = {
  id: number;
  name: string;
  address: string;
  zip: string;
  taxId: string | null;
  email: string | null;
};

type ItemDraft = {
  id: string;
  description: string;
  amount: string;
};

let itemIdCounter = 0;
const newItemId = () => `it-${++itemIdCounter}`;

const today = () => new Date().toISOString().slice(0, 10);

export function NewInvoiceForm({
  issuers,
  clients,
}: {
  issuers: IssuerOption[];
  clients: ClientOption[];
}) {
  const [pending, startTransition] = useTransition();

  const defaultIssuer = issuers.find((i) => i.isDefault) ?? issuers[0];
  const [issuerId, setIssuerId] = useState<string>(String(defaultIssuer.id));

  const [clientSelection, setClientSelection] = useState<string>(
    clients[0] ? String(clients[0].id) : "new",
  );
  const isNewClient = clientSelection === "new";
  const selectedClient = clients.find((c) => String(c.id) === clientSelection);

  const [date, setDate] = useState(today);
  const [clientName, setClientName] = useState(selectedClient?.name ?? "");
  const [clientAddr, setClientAddr] = useState(selectedClient?.address ?? "");
  const [clientZip, setClientZip] = useState(selectedClient?.zip ?? "");
  const [clientTaxId, setClientTaxId] = useState(selectedClient?.taxId ?? "");
  const [clientEmail, setClientEmail] = useState(selectedClient?.email ?? "");
  const [job, setJob] = useState("Desarrollo y Programación");
  const [conditions, setConditions] = useState("");
  const [ivaPercent, setIvaPercent] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<ItemDraft[]>(() => [
    {
      id: newItemId(),
      description: "Servicios de Desarrollo y Programación",
      amount: "",
    },
  ]);

  function pickClient(value: string) {
    setClientSelection(value);
    if (value === "new") {
      setClientName("");
      setClientAddr("");
      setClientZip("");
      setClientTaxId("");
      setClientEmail("");
    } else {
      const c = clients.find((cl) => String(cl.id) === value);
      if (c) {
        setClientName(c.name);
        setClientAddr(c.address);
        setClientZip(c.zip);
        setClientTaxId(c.taxId ?? "");
        setClientEmail(c.email ?? "");
      }
    }
  }

  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const ivaValue = subtotal * (Number(ivaPercent) / 100 || 0);
  const total = subtotal + ivaValue;

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: newItemId(), description: "", amount: "" },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((it) => it.id !== id),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createInvoice({
          issuerId: Number(issuerId),
          clientId: isNewClient ? null : Number(clientSelection),
          date,
          clientName,
          clientAddr,
          clientZip,
          clientTaxId: clientTaxId || null,
          clientEmail: clientEmail || null,
          job,
          conditions,
          ivaPercent: Number(ivaPercent) || 0,
          currency,
          items: items.map((it) => ({
            description: it.description,
            amount: Number(it.amount) || 0,
          })),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="issuer">Emisor</Label>
            <Select value={issuerId} onValueChange={setIssuerId}>
              <SelectTrigger id="issuer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {issuers.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name} · CUIT {i.cuit}
                    {i.isDefault ? " (predeterminado)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="client-pick">Seleccionar cliente</Label>
            <Select value={clientSelection} onValueChange={pickClient}>
              <SelectTrigger id="client-pick">
                <SelectValue placeholder="Elegir cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.taxId ? ` · ${c.taxId}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Nuevo cliente</SelectItem>
              </SelectContent>
            </Select>
            {!isNewClient ? (
              <p className="text-xs text-muted-foreground">
                Datos cargados desde el cliente. Editalos sólo si querés que
                esta factura tenga un snapshot diferente — la ficha del cliente
                no se modifica desde acá.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Se va a guardar como cliente nuevo en tu catálogo.
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clientName">Razón social</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clientAddr">Dirección</Label>
            <Input
              id="clientAddr"
              value={clientAddr}
              onChange={(e) => setClientAddr(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientZip">Código postal / ciudad</Label>
            <Input
              id="clientZip"
              value={clientZip}
              onChange={(e) => setClientZip(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientTaxId">CIF / CUIT / RUT</Label>
            <Input
              id="clientTaxId"
              value={clientTaxId}
              onChange={(e) => setClientTaxId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trabajo y condiciones</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="job">Trabajo</Label>
            <Input
              id="job"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conditions">Condiciones</Label>
            <Textarea
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
              placeholder="Envío por WesterUnion. CUIT: ..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Ítems</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            + Agregar ítem
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="grid grid-cols-[1fr_140px_auto] gap-2">
              <Input
                placeholder="Descripción"
                value={it.description}
                onChange={(e) =>
                  updateItem(idx, { description: e.target.value })
                }
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={it.amount}
                onChange={(e) => updateItem(idx, { amount: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(it.id)}
                disabled={items.length === 1}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Separator className="my-3" />

          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="space-y-1.5">
              <Label htmlFor="iva">I.V.A. (%)</Label>
              <Input
                id="iva"
                type="number"
                step="0.01"
                value={ivaPercent}
                onChange={(e) => setIvaPercent(e.target.value)}
              />
            </div>

            <div className="space-y-1 self-end rounded-md bg-muted/50 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {subtotal.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-medium">
                  {ivaValue.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  {total.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Generando…" : "Crear factura"}
        </Button>
      </div>
    </form>
  );
}
