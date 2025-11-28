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
  // Track the order intent: "orderNow" or "preOrder" - determines navigation destination
  const [orderIntent, setOrderIntent] = useState(null);

  /**
   * Set items for direct checkout (Order Now)
   * @param {Array} items - Items to checkout directly
   * @param {string} intent - "orderNow" or "preOrder" to determine navigation
   */
  const setDirectCheckoutItems = (items, intent = "orderNow") => {
    setCheckoutItems(items);
    setIsDirectCheckout(true);
    setOrderIntent(intent);
  };

  /**
   * Clear checkout items and reset to cart mode
   */
  const clearCheckoutItems = () => {
    setCheckoutItems([]);
    setIsDirectCheckout(false);
    setOrderIntent(null);
  };

  /**
   * Switch to cart checkout mode
   */
  const useCartCheckout = () => {
    setCheckoutItems([]);
    setIsDirectCheckout(false);
    setOrderIntent(null);
  };

  const value = {
    checkoutItems,
    isDirectCheckout,
    orderIntent,
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
