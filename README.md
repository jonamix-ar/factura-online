# mi-factura

Sistema local de facturación construido con Next.js 16, Prisma 7 + SQLite y `@react-pdf/renderer`. Pensado para correr en `localhost`: emisor configurable, catálogo de clientes reutilizable, generación de PDF y visor embebido.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **React 19** + **Tailwind v4** + **shadcn/ui** + **next-themes** (modo claro/oscuro)
- **Prisma 7** con adapter `@prisma/adapter-better-sqlite3` (SQLite local)
- **@react-pdf/renderer** para generar el PDF en el server
- **bun** como package manager y runtime de scripts

## Requisitos

- [Bun](https://bun.sh) ≥ 1.3
- Node.js 20+ (lo usa Prisma internamente para algunos scripts)
- Windows, macOS o Linux

## Instalación

```bash
git clone <repo-url> mi-factura
cd mi-factura

# 1) Dependencias
bun install
bun pm trust better-sqlite3   # compila el binding nativo de SQLite

# 2) Variables de entorno
cp .env.example .env

# 3) Base de datos: crear el archivo SQLite y aplicar las migraciones
bunx prisma migrate deploy
bunx prisma generate

# 4) Seed inicial (crea un emisor placeholder)
bunx tsx prisma/seed.ts

# 5) Levantar el dev server
bun run dev
```

Abrí [http://localhost:3000](http://localhost:3000). La primera vez vas a entrar a `/facturas` (vacía) — andá a **Configuración** para reemplazar el emisor placeholder con tus datos reales antes de emitir la primera factura.

## Estructura

```
src/
  app/
    facturas/         # listado, detalle, nueva, server actions
    clientes/         # CRUD de clientes
    configuracion/    # CRUD de emisores
  components/         # AppNav, ThemeProvider, ThemeToggle, ui/*
  lib/
    prisma.ts         # singleton del cliente Prisma con adapter SQLite
    pdf/              # componente PDF + render server-side
    currencies.ts     # catálogo de monedas
    format.ts         # helpers (número, fecha, moneda)
prisma/
  schema.prisma       # Issuer, Client, Invoice, InvoiceItem
  migrations/         # historial de migraciones
  seed.ts             # emisor placeholder
public/invoice/       # destino de los PDFs generados (gitignored)
```

## Modelo de datos

- **`Issuer`**: emisor de facturas. Soporta múltiples; uno marcado como `isDefault`.
- **`Client`**: catálogo reutilizable de clientes.
- **`Invoice`**: cada factura referencia un `Issuer` y un `Client` (FK con `ON DELETE SET NULL`) y además **guarda un snapshot inmutable** de ambos. Si editás o borrás un emisor/cliente en el futuro, las facturas pasadas mantienen los datos con los que se emitieron.
- **`InvoiceItem`**: ítems de cada factura.

## Scripts útiles

```bash
bun run dev               # dev server
bun run build             # build de producción
bunx prisma studio        # GUI sobre la DB local
bunx prisma migrate dev   # aplicar nuevas migraciones en desarrollo
```

## Datos sensibles y `.gitignore`

El proyecto está configurado para que **tus datos reales no suban a GitHub**:

- `prisma/*.db` — la base SQLite con tus facturas, emisores y clientes
- `public/invoice/*.pdf` — los PDFs generados (incluyen direcciones, CUIT, emails, etc.)
- `.env` — la URL de la base
- `prisma/backfill-invoices.ts` — script personal de seed histórico

Mirá [`.gitignore`](.gitignore) para la lista completa. Si vas a contribuir o forkear, no commitees datos personales.

## Cosas a tener en cuenta

- **Cambios de schema en dev**: si modificás `prisma/schema.prisma` y corre `prisma migrate dev`, es probable que tengas que **reiniciar el dev server** (Ctrl+C + `bun run dev`). Turbopack cachea el cliente Prisma generado en memoria.
- **Warning de `<script>` de React 19**: viene de `next-themes` (inyecta su anti-FOUC con `dangerouslySetInnerHTML`). Es un falso positivo, el script sí se ejecuta porque va en el HTML SSR.
- El sistema está pensado para **uso local**, no tiene autenticación. Si lo expusieras en una red, agregale auth antes.
