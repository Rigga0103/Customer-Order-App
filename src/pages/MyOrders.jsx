import React, { useState, useEffect } from 'react';
import { LS, updateOrderStatus } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, Truck, Package, XCircle, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';

const MyOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const loadOrders = () => {
        if (!user) return;
        const all = LS.get('ri_orders');
        const myOrders = user.role === 'admin' ? all : all.filter(o => o.customer_id === user.id);
        setOrders(myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    useEffect(() => {
        loadOrders();
        window.addEventListener('ri_data_changed', loadOrders);
        return () => window.removeEventListener('ri_data_changed', loadOrders);
    }, [user]);

    const handleCancel = (e, orderId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to cancel this order?')) {
            updateOrderStatus(orderId, 'CANCELLED', { by: user.id });
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
            <h1 className="text-2xl font-bold text-slate-800">{user?.role === 'admin' ? 'All Orders' : 'My Orders'}</h1>

            {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No orders yet</p>
                    <p className="text-sm text-slate-400">Your order history will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.order_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
                            <div
                                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4 bg-slate-50/30"
                                onClick={() => toggleExpand(order.order_id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-50 rounded-lg text-red-600 hidden sm:block">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{order.order_id}</span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Product ID: {order.product_id} • Qty: {order.quantity}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Amount</p>
                                        <p className="font-bold text-slate-900 text-lg">₹{order.amount}</p>
                                    </div>
                                    {expandedOrder === order.order_id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrder === order.order_id && (
                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Timeline */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock size={16} className="text-red-500" />
                                                <h4 className="font-semibold text-slate-800 text-sm">Order Timeline</h4>
                                            </div>
                                            <div className="relative pl-3 border-l-2 border-slate-100 ml-2 space-y-6">
                                                {order.history.map((h, i) => (
                                                    <div key={i} className="relative pl-6">
                                                        <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-slate-200 shadow-sm z-10">
                                                            {getStatusIcon(h.status)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{h.status}</span>
                                                            <span className="text-xs text-slate-500">{new Date(h.at).toLocaleString()}</span>
                                                            {h.vehicleNo && <span className="text-xs text-slate-600 mt-1 bg-slate-100 px-2 py-1 rounded w-fit">Vehicle: {h.vehicleNo}</span>}
                                                            {h.proof && <span className="text-xs text-blue-600 mt-1 underline cursor-pointer">View Proof</span>}
                                                            {h.reason && <span className="text-xs text-red-500 mt-1 italic">Reason: {h.reason}</span>}
                                                            {h.by && user.role === 'admin' && <span className="text-[10px] text-slate-400">By: {h.by}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Info */}
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <h4 className="font-semibold text-slate-800 text-sm mb-2">Delivery Details</h4>
                                                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Address:</span> {order.address}</p>
                                                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Payment:</span> {order.paymentType}</p>
                                                {order.scheme_id && <p className="text-sm text-green-600"><span className="font-medium">Scheme:</span> {order.scheme_id}</p>}
                                                <p className="text-sm text-slate-600 mt-2"><span className="font-medium">Customer:</span> {order.customer_id}</p>
                                            </div>

                                            {order.status === 'PENDING' && (
                                                <button
                                                    onClick={(e) => handleCancel(e, order.order_id)}
                                                    className="w-full py-3 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} /> Cancel Order
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
