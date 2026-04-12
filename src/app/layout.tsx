import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { currentTheme } from "@/config/theme";
import { MultiSessionWarning } from "@/components/MultiSessionWarning";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventario Hardware | Bodega",
  description: "Sistema de control de ingreso y salida de equipos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${currentTheme.background} ${currentTheme.text} antialiased min-h-screen transition-colors duration-300 relative`}>
        {children}
        {/* Renderizamos la alerta a nivel global */}
        <MultiSessionWarning />
      </body>
    </html>
  );
}