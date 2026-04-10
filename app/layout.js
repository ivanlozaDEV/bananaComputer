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
  title: "Banana Computer | Tienda de Laptops en Ecuador",
  description: "Especialistas en laptops de alto rendimiento con garantía local en Ecuador.",
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
