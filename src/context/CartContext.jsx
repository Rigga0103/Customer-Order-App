import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (product, qty, scheme) => {
        const gross = product.price * qty;
        const discount = scheme ? (gross * scheme.discount_percent / 100) : 0;
        const finalAmount = Math.max(0, gross - discount);

        const item = {
            id: Date.now(),
            product,
            qty: Number(qty),
            scheme,
            finalAmount,
        };

        setCart(prev => [...prev, item]);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQty = (id, newQty) => {
        const qty = parseInt(newQty, 10);
        if (isNaN(qty) || qty < 1) return;

        setCart(prev => prev.map(item => {
            if (item.id !== id) return item;
            const gross = item.product.price * qty;
            const discount = item.scheme ? (gross * item.scheme.discount_percent / 100) : 0;
            return { ...item, qty, finalAmount: Math.max(0, gross - discount) };
        }));
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
