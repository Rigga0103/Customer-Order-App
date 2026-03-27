import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, Truck, Package, XCircle, ChevronDown, ChevronUp, PackageCheck, Calendar, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '../components/SkeletonLoader';
import OrderTracker from '../components/OrderTracker';
import ReviewSection from '../components/Reviews/ReviewSection';

const MyOrders = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [highlightedOrder, setHighlightedOrder] = useState(searchParams.get('highlight') || null);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const highlightRef = useRef(null);

    // Read URL params on mount & changes
    useEffect(() => {
        const highlight = searchParams.get('highlight');
        if (highlight) {
            setHighlightedOrder(highlight);
            setExpandedOrder(highlight); // Auto-expand the highlighted order
            const timer = setTimeout(() => setHighlightedOrder(null), 4000);
            setSearchParams({}, { replace: true });
            return () => clearTimeout(timer);
        }
    }, [searchParams, setSearchParams]);

    // Scroll highlighted order into view
    useEffect(() => {
        if (highlightedOrder && highlightRef.current && !loading) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedOrder, loading]);

    const loadOrders = useCallback(async () => {
        if (!user) return;
        let query = supabase.from('orders').select(`
            *, 
            users!customer_id (first_name, email),
            products!product_id(name, image_url, price, category)
        `).order('created_at', { ascending: false });
        
        if (user.role !== 'admin') {
            query = query.eq('customer_id', user.id);
        }
        const { data, error } = await query;
        if (data && !error) {
            const enriched = data.map(o => ({
                ...o,
                customer_name: o.users?.first_name || o.users?.email || o.customer_id,
                product_name: o.products?.name || 'Product Not Found',
                product_image: o.products?.image_url || 'https://placehold.co/400?text=Product',
                product_category: o.products?.category || 'General'
            }));
            setOrders(enriched);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadOrders();
        window.addEventListener('ri_data_changed', loadOrders);
        return () => window.removeEventListener('ri_data_changed', loadOrders);
    }, [loadOrders]);

    const handleCancel = async (e, orderId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to cancel this order?')) {
            await supabase.from('orders').update({ status: 'CANCELLED' }).eq('order_id', orderId);
            loadOrders();
        }
    };

    const toggleExpand = (id) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} className="text-amber-500" />;
            case 'APPROVED': return <CheckCircle size={16} className="text-cyan-500" />;
            case 'DISPATCHED': return <Truck size={16} className="text-blue-500" />;
            case 'DELIVERED': return <Package size={16} className="text-emerald-500" />;
            case 'REJECTED': return <XCircle size={16} className="text-red-500" />;
            case 'CANCELLED': return <XCircle size={16} className="text-slate-500" />;
            default: return <Clock size={16} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'APPROVED': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
            case 'DISPATCHED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <AnimatePresence mode="wait">
                {trackingOrder ? (
                    <OrderTracker 
                        key="tracker"
                        order={trackingOrder} 
                        onBack={() => setTrackingOrder(null)} 
                    />
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >

            {loading ? (
                <SkeletonLoader type="list" count={5} />
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No orders yet</p>
                    <p className="text-sm text-slate-400">Your order history will appear here</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {orders.map(order => {
                        const isHighlighted = highlightedOrder === order.order_id;
                        const isExpanded = expandedOrder === order.order_id;
                        return (
                        <div
                            key={order.order_id}
                            ref={isHighlighted ? highlightRef : null}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 ${
                                isHighlighted
                                    ? 'border-red-400 ring-2 ring-red-300 ring-offset-2 bg-red-50/20 shadow-lg shadow-red-200/50 scale-[1.01]'
                                    : 'border-slate-200'
                            }`}
                        >
                            <div 
                                className="p-5 md:flex gap-6 items-start cursor-pointer transition-colors hover:bg-slate-50/50"
                                onClick={() => toggleExpand(order.order_id)}
                            >
                                {/* Left: Product Image */}
                                <div className="relative shrink-0 mb-4 md:mb-0">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group-hover:shadow-md transition-all duration-300">
                                        <img 
                                            src={order.product_image} 
                                            alt={order.product_name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                                            onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                        />
                                    </div>
                                    <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg shadow-black/20 z-10">
                                        {order.product_category}
                                    </div>
                                </div>

                                {/* Center: Details */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)} animate-fade-in`}>
                                                {order.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono tracking-tighter bg-slate-50 px-2 py-0.5 rounded">
                                                #{order.order_id}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                                            {order.product_name}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                                            <p className="text-slate-500">PID: <span className="text-slate-900 font-bold">{order.product_id}</span></p>
                                            <p className="text-slate-500">Qty: <span className="text-slate-900 font-bold">{order.quantity}</span></p>
                                            <p className="text-slate-500">Payment: <span className="text-slate-900 font-bold">{order.payment_type}</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Calendar size={13} />
                                            <span className="text-xs font-semibold">{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Price</p>
                                                <p className="text-xl font-black text-slate-900">₹{order.amount?.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Customer</p>
                                                <p className="text-xs font-bold text-slate-700">{order.customer_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Toggle Icon */}
                                <div className="shrink-0 self-center hidden md:block">
                                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="p-6 border-t border-slate-100 bg-white animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Timeline */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock size={16} className="text-red-500" />
                                                <h4 className="font-semibold text-slate-800 text-sm">Order Status</h4>
                                            </div>
                                            <div className="relative pl-3 border-l-2 border-slate-100 ml-2 space-y-6">
                                                {/* Placed event */}
                                                <div className="relative pl-6">
                                                    <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-slate-200 shadow-sm z-10">
                                                        <Clock size={16} className="text-amber-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">Order Placed</span>
                                                        <span className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {/* Current Status if changed */}
                                                {order.status !== 'PENDING' && (
                                                    <div className="relative pl-6">
                                                        <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-slate-200 shadow-sm z-10">
                                                            {getStatusIcon(order.status)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{order.status}</span>
                                                            <span className="text-xs text-slate-500">Latest Update</span>
                                                            {order.dispatch_info?.vehicleNo && <span className="text-xs text-slate-600 mt-1 bg-slate-100 px-2 py-1 rounded w-fit">Vehicle: {order.dispatch_info.vehicleNo}</span>}
                                                            {order.delivery_info?.proof && <span className="text-xs text-blue-600 mt-1 underline cursor-pointer">View Proof</span>}
                                                            {order.delivery_info?.reason && <span className="text-xs text-red-500 mt-1 italic">Reason: {order.delivery_info.reason}</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Info */}
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <h4 className="font-semibold text-slate-800 text-sm mb-2">Delivery Details</h4>
                                                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Address:</span> {order.address}</p>
                                                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Payment:</span> {order.payment_type}</p>
                                                {order.scheme_id && <p className="text-sm text-green-600"><span className="font-medium">Scheme:</span> {order.scheme_id}</p>}
                                            </div>

                                             {order.status === 'PENDING' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancel(e, order.order_id);
                                                    }}
                                                    className="w-full py-3 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-all shadow-sm text-sm flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <X size={16} className="group-hover/btn:rotate-90 transition-transform" /> Cancel Order
                                                </button>
                                            )}

                                            {user?.role !== 'admin' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTrackingOrder(order);
                                                    }}
                                                    className="w-full py-3 bg-blue-600 border border-blue-700 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm flex items-center justify-center gap-2 group/track"
                                                >
                                                    <Navigation size={16} className="group-hover/track:translate-x-1 group-hover/track:-translate-y-1 transition-transform" /> Track My Order
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Section */}
                                    {user?.role !== 'admin' && (
                                        <ReviewSection order={order} />
                                    )}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    )}
</AnimatePresence>
</div>
);
};

export default MyOrders;
