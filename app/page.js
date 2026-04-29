import React from 'react';
import HomeClient from './HomeClient';

export const metadata = {
  title: "Banana Computer | Laptops y Tecnología con Garantía en Ecuador",
  description: "La mejor selección de laptops de alto rendimiento, gaming y Apple con garantía local en Ecuador. Entrega inmediata y soporte técnico experto.",
  keywords: [
    "laptops ecuador", 
    "computadoras ecuador", 
    "laptops gaming ecuador", 
    "apple ecuador", 
    "asus tuf ecuador", 
    "rog strix ecuador",
    "lenovo legion ecuador", 
    "garantia real", 
    "banana computer"
  ],
  openGraph: {
    title: "Banana Computer | Tecnología con Garantía en Ecuador",
    description: "Expertos en hardware de alta gama y laptops con garantía oficial local.",
    images: ["/icon.png"],
  },
};

export default function Page() {
  return <HomeClient />;
}
