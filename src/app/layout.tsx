import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mi-factura",
  description: "Sistema local de facturas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-muted/30 font-sans">
        <ThemeProvider>
          <AppNav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            {children}
          </main>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
