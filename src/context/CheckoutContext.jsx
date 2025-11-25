import React, { createContext, useContext, useState } from "react";

const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
};

/**
 * CheckoutContext Provider
 * 
 * Manages temporary checkout items when "Order Now" is clicked.
 * This allows bypassing the cart and going directly to checkout with a single item.
 */
export const CheckoutProvider = ({ children }) => {
  // Temporary items for "Order Now" flow (bypasses cart)
  const [checkoutItems, setCheckoutItems] = useState([]);
  // Flag to indicate if we're in "Order Now" mode vs "Cart Checkout" mode
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);

  /**
   * Set items for direct checkout (Order Now)
   * @param {Array} items - Items to checkout directly
   */
  const setDirectCheckoutItems = (items) => {
    setCheckoutItems(items);
    setIsDirectCheckout(true);
  };

  /**
   * Clear checkout items and reset to cart mode
   */
  const clearCheckoutItems = () => {
    setCheckoutItems([]);
    setIsDirectCheckout(false);
  };

  /**
   * Switch to cart checkout mode
   */
  const useCartCheckout = () => {
    setCheckoutItems([]);
    setIsDirectCheckout(false);
  };

  const value = {
    checkoutItems,
    isDirectCheckout,
    setDirectCheckoutItems,
    clearCheckoutItems,
    useCartCheckout,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};
