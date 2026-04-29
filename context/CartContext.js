"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getOrderBreakdown } from '@/lib/pricing';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer');

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('banana_cart');
    if (saved) {
      try { setCartItems(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('banana_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    const itemsToAdd = Array.from({ length: quantity }, () => ({
      ...product,
      cartId: Date.now() + Math.random()
    }));
    setCartItems((prev) => [...prev, ...itemsToAdd]);
    setIsCartOpen(true); // auto-open sidebar on add
  };

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const openCart  = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const clearCart = () => setCartItems([]);

  const getFinalPrice = (item, method) => {
    if (method === 'transfer') return parseFloat(item.transfer_price) || (parseFloat(item.price) / 1.06);
    return parseFloat(item.price) || 0;
  };

  const pricing = getOrderBreakdown(cartItems, paymentMethod);

  const baseTotal     = pricing.baseTotalConIva;
  const cartTotal     = pricing.cartTotalConIva;
  const cartSubtotal  = pricing.baseImponible;
  const cartTax       = pricing.iva;
  const discountAmount = pricing.discountConIva;
  const cartCount     = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, clearCart,
      cartCount, cartTotal, cartSubtotal, cartTax,
      baseTotal, discountAmount,
      paymentMethod, setPaymentMethod, getFinalPrice,
      isCartOpen, openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
