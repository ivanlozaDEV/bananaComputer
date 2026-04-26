"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('payphone');

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

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
    setIsCartOpen(true); // auto-open sidebar on add
  };

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const openCart  = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const clearCart = () => setCartItems([]);

  const getFinalPrice = (basePrice, method) => {
    if (method === 'transfer') return basePrice / 1.06;
    return basePrice;
  };

  const baseTotal     = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const cartTotal     = paymentMethod === 'transfer' ? baseTotal / 1.06 : baseTotal;
  const cartSubtotal  = cartTotal / 1.15;
  const cartTax       = cartTotal - cartSubtotal;
  const discountAmount = baseTotal - cartTotal;
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
