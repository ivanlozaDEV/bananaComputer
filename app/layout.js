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
  title: {
    default: "Banana Computer | Laptops y Tecnología con Garantía en Ecuador",
    template: "%s | Banana Computer Ecuador"
  },
  description: "La mejor selección de laptops de alto rendimiento, gaming y Apple con garantía local en Ecuador. Entrega inmediata y soporte técnico experto.",
  keywords: ["laptops ecuador", "computadoras ecuador", "laptops gaming", "apple ecuador", "asus ecuador", "lenovo ecuador", "garantia real", "tienda tecnologia quito", "tienda tecnologia guayaquil"],
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
    description: "Expertos en hardware de alta gama y laptops con garantía oficial local en Ecuador.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Banana Computer Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Banana Computer | Tecnología con Garantía en Ecuador",
    description: "Expertos en hardware de alta gama y laptops con garantía oficial local en Ecuador.",
    images: ["/icon.png"],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://bananacomputer.store/',
  },
};

export default function RootLayout({ children }) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Banana Computer",
    "url": "https://bananacomputer.store",
    "logo": "https://bananacomputer.store/icon.png",
    "sameAs": [
      "https://www.instagram.com/bananacomputer.ec/", // Example, adjust if needed
      "https://www.facebook.com/bananacomputer.ec/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+593-900-000-000", // Placeholder, adjust if possible
      "contactType": "customer service",
      "areaServed": "EC",
      "availableLanguage": "Spanish"
    }
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Banana Computer",
    "url": "https://bananacomputer.store",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://bananacomputer.store/buscar?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html
      lang="es"
      className={`${inter.variable} ${dotGothic.variable} ${pixelify.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
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
