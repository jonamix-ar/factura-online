"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/facturas", label: "Facturas" },
  { href: "/facturas/nueva", label: "Nueva factura" },
  { href: "/clientes", label: "Clientes" },
  { href: "/configuracion", label: "Configuración" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/facturas" className="text-lg font-semibold">
          mi-factura
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1">
            {links.map((l) => {
              const active =
                l.href === "/facturas"
                  ? pathname === "/facturas"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
