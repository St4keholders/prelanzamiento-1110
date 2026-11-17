import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Lanzamiento 1110 · 11Diez",
  description: "Reserva tu mesa con tu Team de Ardillas para el evento de lanzamiento de 1110 en Medellín.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sora.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">{children}</body>
    </html>
  );
}
