import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    CheckCircle,
    AlertTriangle,
    Info,
    XCircle,
    Bell,
    Trash2,
    Clock,
    Truck,
    Package,
    ShieldCheck,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

// Status-specific icons for order notifications
const STATUS_ICONS = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    DISPATCHED: Truck,
    DELIVERED: Package,
    CANCELLED: XCircle,
    REJECTED: ShieldCheck,
};

// Fallback type icons
const TYPE_ICONS = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    error: XCircle,
};

const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
};

const NotificationPanel = () => {
    const {
        notifications,
        unreadCount,
        isOpen,
        removeNotification,
        markAsRead,
        clearAll,
        togglePanel,
        closePanel,
        NOTIFICATION_TYPES,
    } = useNotifications();

    const { user } = useAuth();
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const bellRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                bellRef.current &&
                !bellRef.current.contains(event.target)
            ) {
                closePanel();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closePanel]);

    // Close panel on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') closePanel();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closePanel]);

    // Handle notification click — navigate to the relevant page
    const handleNotificationClick = (notification) => {
        // Mark as read
        markAsRead(notification.id);
        closePanel();

        if (notification.productId) {
            navigate(`/all-products`);
        } else if (user?.role === 'admin') {
            // Admin: navigate to Customer Orders with tab & highlight
            const tab = notification.tab || 'pending';
            navigate(`/admin/pending?tab=${tab}&highlight=${notification.orderId}`);
        } else {
            // User: navigate to My Orders with highlight
            navigate(`/orders?highlight=${notification.orderId}`);
        }
    };

    return (
        <div className="relative" id="notification-system">
            {/* Bell Icon Button */}
            <button
                ref={bellRef}
                onClick={togglePanel}
                id="notification-bell"
                className={`relative p-2.5 rounded-full transition-all duration-300 ${
                    isOpen
                        ? 'bg-red-50 text-red-600 shadow-lg shadow-red-500/10 ring-1 ring-red-200'
                        : 'hover:bg-white text-slate-400 hover:text-red-600 hover:shadow-lg hover:shadow-red-500/10'
                }`}
                aria-label="Toggle notifications"
            >
                <Bell size={22} />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div
                        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 md:hidden"
                        onClick={closePanel}
                    />

                    <div
                        ref={panelRef}
                        id="notification-panel"
                        className="absolute right-0 top-[calc(100%+12px)] w-[92vw] max-w-[420px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/60 z-50 overflow-hidden"
                        style={{ maxHeight: 'calc(100vh - 100px)' }}
                    >
                        {/* Panel Header */}
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2.5 py-0.5 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold rounded-full shadow-sm">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearAll}
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                                            title="Clear all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div
                            className="overflow-y-auto p-3 space-y-2.5 custom-scrollbar"
                            style={{ maxHeight: 'calc(100vh - 200px)' }}
                        >
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Bell size={28} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">
                                        No notifications
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        You're all caught up!
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
                                    // Use status-specific icon if available, fallback to type icon
                                    const Icon = STATUS_ICONS[notification.status] || TYPE_ICONS[notification.type] || Info;

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`group relative flex items-start gap-3.5 p-4 rounded-[10px] border-l-[4px] cursor-pointer transition-all duration-300 
                                                ${typeConfig.borderColor}
                                                ${notification.read
                                                    ? 'bg-white hover:bg-slate-50/80 shadow-sm'
                                                    : `bg-gradient-to-r ${typeConfig.bgGradient} shadow-md hover:shadow-lg`
                                                }
                                                hover:translate-x-0.5
                                            `}
                                        >
                                            {/* Unread indicator dot */}
                                            {!notification.read && (
                                                <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-red-500 ring-2 ring-rose-200 animate-pulse" />
                                            )}

                                            {/* Icon */}
                                            <div
                                                className={`flex-shrink-0 w-10 h-10 rounded-xl ${typeConfig.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                                            >
                                                <Icon size={20} className={typeConfig.iconColor} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p
                                                        className={`text-sm font-semibold truncate ${
                                                            notification.read
                                                                ? 'text-slate-600'
                                                                : 'text-slate-800'
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                </div>
                                                <p
                                                    className={`text-xs leading-relaxed line-clamp-2 ${
                                                        notification.read
                                                            ? 'text-slate-400'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    {notification.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${typeConfig.badgeColor}`}
                                                    >
                                                        {notification.status || notification.type}
                                                    </span>
                                                    {notification.orderId && (
                                                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {notification.orderId}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {formatTimeAgo(notification.timestamp)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Close / Remove button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notification.id);
                                                }}
                                                className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                title="Dismiss"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Panel Footer */}
                        {notifications.length > 0 && (
                            <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-5 py-3">
                                <p className="text-[11px] text-center text-slate-400 font-medium">
                                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationPanel;
