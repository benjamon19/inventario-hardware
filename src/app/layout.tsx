import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript"; // <-- IMPORTANTE
import { MultiSessionWarning } from "@/components/MultiSessionWarning";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventario Hardware | Bodega",
  description: "Sistema de control de ingreso y salida de equipos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning es OBLIGATORIO para evitar errores de consola
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} antialiased min-h-screen relative`}>
        {children}
        <MultiSessionWarning />
      </body>
    </html>
  );
}