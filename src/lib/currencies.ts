export type Currency = {
  code: string;
  label: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", label: "USD · Dólar estadounidense" },
  { code: "ARS", label: "ARS · Peso argentino" },
  { code: "EUR", label: "EUR · Euro" },
  { code: "GBP", label: "GBP · Libra esterlina" },
  { code: "BRL", label: "BRL · Real brasileño" },
  { code: "CLP", label: "CLP · Peso chileno" },
  { code: "UYU", label: "UYU · Peso uruguayo" },
  { code: "MXN", label: "MXN · Peso mexicano" },
  { code: "BOB", label: "BOB · Boliviano" },
  { code: "PYG", label: "PYG · Guaraní" },
  { code: "PEN", label: "PEN · Sol peruano" },
];
