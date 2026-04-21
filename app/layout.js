import { Inter, DotGothic16, Pixelify_Sans } from "next/font/google";
import React, { Suspense } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import BananaLoader from "@/components/BananaLoader";
 
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
 
const dotGothic = DotGothic16({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixel-legacy",
  subsets: ["latin"],
});

export const metadata = {
  title: "Banana Computer | Laptops y Tecnología con Garantía en Ecuador",
  description: "La mejor selección de laptops de alto rendimiento, gaming y Apple con garantía local en Ecuador. Entrega inmediata y soporte técnico experto.",
  keywords: ["laptops ecuador", "computadoras ecuador", "laptops gaming", "apple ecuador", "asus ecuador", "lenovo ecuador", "garantia real", "banana computer"],
  authors: [{ name: "Banana Computer" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://bananacomputer.store/",
    siteName: "Banana Computer",
    title: "Banana Computer | Tecnología con Garantía en Ecuador",
    description: "Expertos en hardware de alta gama y laptops con garantía oficial local.",
    images: [
      {
        url: "/icon.png", // Fallback image
        width: 512,
        height: 512,
        alt: "Banana Computer Logo",
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://bananacomputer.store/',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${dotGothic.variable} ${pixelify.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-inter">
        <Providers>
          <Suspense fallback={null}>
            <BananaLoader />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
