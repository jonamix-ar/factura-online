export function formatInvoiceNumber(n: number): string {
  return String(n).padStart(5, "0");
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatAmount(value: number, currency: string): string {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
  return `${rounded.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
