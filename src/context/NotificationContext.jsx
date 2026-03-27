import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Notification types configuration
const NOTIFICATION_TYPES = {
    success: {                                                                                                                                              
        color: 'emerald',
        bgGradient: 'from-emerald-50 to-emerald-100/50',
        borderColor: 'border-l-emerald-500',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    warning: {
        color: 'amber',
        bgGradient: 'from-amber-50 to-amber-100/50',
        borderColor: 'border-l-amber-500',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        badgeColor: 'bg-amber-100 text-amber-700',
    },
    info: {
        color: 'blue',
        bgGradient: 'from-blue-50 to-blue-100/50',
        borderColor: 'border-l-blue-500',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-700',
    },
    error: {
        color: 'rose',
        bgGradient: 'from-rose-50 to-rose-100/50',
        borderColor: 'border-l-rose-500',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        badgeColor: 'bg-rose-100 text-rose-700',
    },
};

// Map order status to notification type and details
const STATUS_CONFIG = {
    PENDING: {
        type: 'info',
        adminTitle: 'New Order Received',
        userTitle: 'Order Placed',
        adminDesc: (order) => `New order ${order.order_id} received from ${order.customer_name || 'customer'}.`,
        userDesc: (order) => `Your order ${order.order_id} has been placed successfully.`,
        tab: 'pending',
    },
    APPROVED: {
        type: 'success',
        adminTitle: 'Order Approved',
        userTitle: 'Order Approved',
        adminDesc: (order) => `Order ${order.order_id} from ${order.customer_name || 'customer'} has been approved.`,
        userDesc: (order) => `Your order ${order.order_id} has been approved.`,
        tab: 'approved',
    },
    DISPATCHED: {
        type: 'info',
        adminTitle: 'Order Dispatched',
        userTitle: 'Order Dispatched',
        adminDesc: (order) => `Order ${order.order_id} for ${order.customer_name || 'customer'} has been dispatched.`,
        userDesc: (order) => `Your order ${order.order_id} has been dispatched.`,
        tab: 'dispatched',
    },
    DELIVERED: {
        type: 'success',
        adminTitle: 'Order Delivered',
        userTitle: 'Order Delivered',
        adminDesc: (order) => `Order ${order.order_id} has been delivered to ${order.customer_name || 'customer'}.`,
        userDesc: (order) => `Your order ${order.order_id} has been delivered.`,
        tab: 'delivered',
    },
    CANCELLED: {
        type: 'error',
        adminTitle: 'Order Cancelled',
        userTitle: 'Order Cancelled',
        adminDesc: (order) => `Order ${order.order_id} from ${order.customer_name || 'customer'} has been cancelled.`,
        userDesc: (order) => `Your order ${order.order_id} has been cancelled.`,
        tab: 'cancelled',
    },
    REJECTED: {
        type: 'error',
        adminTitle: 'Order Rejected',
        userTitle: 'Order Rejected',
        adminDesc: (order) => `Order ${order.order_id} from ${order.customer_name || 'customer'} has been rejected.`,
        userDesc: (order) => `Your order ${order.order_id} has been rejected.`,
        tab: 'cancelled',
    },
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(() => {
        try {
            const stored = localStorage.getItem('ri_read_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            const stored = localStorage.getItem('ri_dismissed_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const prevOrdersRef = useRef(null);

    // Persist read IDs
    useEffect(() => {
        localStorage.setItem('ri_read_notifications', JSON.stringify(readIds));
    }, [readIds]);

    // Persist dismissed IDs
    useEffect(() => {
        localStorage.setItem('ri_dismissed_notifications', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    // Fetch orders and build notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        const [ordersResponse, productsResponse] = await Promise.all([
            (user.role === 'admin' 
                ? supabase.from('orders').select('*, users!customer_id(first_name)').order('created_at', { ascending: false }).limit(50)
                : supabase.from('orders').select('*, users!customer_id(first_name)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(25)),
            supabase.from('products').select('product_id, name, stock, created_at')
        ]);

        if (ordersResponse.error || !ordersResponse.data) return;
        const ordersData = ordersResponse.data;
        const productsData = productsResponse.data || [];

        // Calculate dynamic stock for all products
        // We need ALL orders to calculate correct stock, but let's assume 'ordersData' (limit 50) is not enough for full accuracy.
        // For true accuracy we'd need a separate sum query or a better DB structure.
        // However, looking at AllProducts.jsx, it fetches ALL orders to calculate stock.
        // Let's do a quick separate fetch for stock calculation to be accurate.
        const { data: allOrdersForStock } = await supabase.from('orders').select('product_id, quantity, status');
        const boughtByProduct = {};
        if (allOrdersForStock) {
            allOrdersForStock.forEach(o => {
                if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
                    boughtByProduct[o.product_id] = (boughtByProduct[o.product_id] || 0) + o.quantity;
                }
            });
        }

        const isAdmin = user.role === 'admin';

        let orderNotifications = ordersData.map((order) => {
            const status = order.status || 'PENDING';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
            const customerName = order.users?.first_name || 'Unknown';
            const enrichedOrder = { ...order, customer_name: customerName };
            const nId = `order-${order.order_id}-${status}`;

            return {
                id: nId,
                notificationId: nId,
                orderId: order.order_id,
                type: config.type,
                title: isAdmin ? config.adminTitle : config.userTitle,
                message: isAdmin ? config.adminDesc(enrichedOrder) : config.userDesc(enrichedOrder),
                description: isAdmin ? config.adminDesc(enrichedOrder) : config.userDesc(enrichedOrder),
                timestamp: new Date(order.updated_at || order.created_at),
                read: readIds.includes(nId),
                isDismissed: dismissedIds.includes(nId),
                status: status,
                tab: config.tab,
                customerName: customerName,
            };
        }).filter(n => !n.isDismissed);

        // Add Stock Notifications for everyone
        const stockNotifications = productsData.map(product => {
            const currentStock = Math.max(0, (product.stock !== null ? product.stock : 0) - (boughtByProduct[product.product_id] || 0));
            
            if (currentStock <= 10) {
                const nId = `stock-${product.product_id}`;
                return {
                    id: nId,
                    notificationId: nId,
                    productId: product.product_id,
                    orderId: null,
                    type: currentStock <= 0 ? 'error' : 'warning',
                    title: currentStock <= 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
                    message: currentStock <= 0 
                        ? `Product "${product.name}" is out of stock.`
                        : `Product "${product.name}" is low on stock (${currentStock} left).`,
                    description: currentStock <= 0
                        ? `Product "${product.name}" has run completely out of stock. Please update inventory.`
                        : `Product "${product.name}" is running low (${currentStock} items left). Please update inventory.`,
                    timestamp: new Date(new Date().setHours(0, 0, 0, 0)),
                    read: readIds.includes(nId),
                    isDismissed: dismissedIds.includes(nId),
                    status: 'warning',
                    tab: null,
                    customerName: null,
                };
            }
            return null;
        }).filter(n => n !== null && !n.isDismissed);

        orderNotifications = [...orderNotifications, ...stockNotifications];

        // Sort by timestamp descending (latest first)
        orderNotifications.sort((a, b) => b.timestamp - a.timestamp);

        setNotifications(orderNotifications.slice(0, 50));
    }, [user, readIds, dismissedIds]);

    // Initial fetch and polling every 30 seconds
    useEffect(() => {
        if (!user) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);

        // Also listen for data change events
        const handleDataChange = () => fetchNotifications();
        window.addEventListener('ri_data_changed', handleDataChange);

        // Supabase Realtime subscription
        const channel = supabase
            .channel('notification-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => fetchNotifications()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            window.removeEventListener('ri_data_changed', handleDataChange);
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications, user]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const removeNotification = useCallback((id) => {
        setDismissedIds((prev) => [...new Set([...prev, id])]);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const markAsRead = useCallback((id) => {
        setReadIds((prev) => [...new Set([...prev, id])]);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        const allIds = notifications.map((n) => n.id);
        setReadIds((prev) => [...new Set([...prev, ...allIds])]);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, [notifications]);

    const clearAll = useCallback(() => {
        const allIds = notifications.map((n) => n.id);
        setDismissedIds((prev) => [...new Set([...prev, ...allIds])]);
        setNotifications([]);
    }, [notifications]);

    const togglePanel = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isOpen,
                removeNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                togglePanel,
                closePanel,
                NOTIFICATION_TYPES,
                fetchNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};