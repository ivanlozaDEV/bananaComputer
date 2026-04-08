import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const cartSubtotal = cartTotal / 1.15;
  const cartTax = cartTotal - cartSubtotal;
  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, cartCount, cartTotal, cartSubtotal, cartTax }}>
      {children}
    </CartContext.Provider>
  );
};
