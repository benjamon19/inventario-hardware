import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MultiSessionWarning } from "@/components/MultiSessionWarning";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventario Hardware | Bodega",
  description: "Sistema de control de ingreso y salida de equipos",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico?v=2",
  },
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
    <html lang="es">
      <body className={`${inter.className} antialiased min-h-screen relative`}>
        {children}
        <MultiSessionWarning />
      </body>
    </html>
  );
}