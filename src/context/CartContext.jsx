import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
    setIsCartOpen(true); // auto-open sidebar on add
  };

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const openCart  = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartTotal    = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const cartSubtotal = cartTotal / 1.15;
  const cartTax      = cartTotal - cartSubtotal;
  const cartCount    = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart,
      cartCount, cartTotal, cartSubtotal, cartTax,
      isCartOpen, openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};
