import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Check, X, Truck, PackageCheck, AlertCircle, Calendar, FileText, Package } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const CustomerOrder = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'pending');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [highlightedOrder, setHighlightedOrder] = useState(searchParams.get('highlight') || null);
    const highlightRef = useRef(null);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'dispatch', 'deliver'
    const [formData, setFormData] = useState({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });

    // Read URL params on mount & changes
    useEffect(() => {
        const tab = searchParams.get('tab');
        const highlight = searchParams.get('highlight');
        if (tab) setActiveTab(tab);
        if (highlight) {
            setHighlightedOrder(highlight);
            // Clear highlight after 4s
            const timer = setTimeout(() => setHighlightedOrder(null), 4000);
            // Clean up search params
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

    const refreshData = useCallback(async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users!customer_id(first_name),
                products!product_id(name, image_url, price, category)
            `)
            .order('created_at', { ascending: false });
        
        if (data && !error) {
            const enrichedOrders = data.map(o => ({
                ...o,
                customer_name: o.users?.first_name || 'Unknown User',
                product_name: o.products?.name || 'Product Not Found',
                product_image: o.products?.image_url || 'https://placehold.co/400?text=Product',
                product_category: o.products?.category || 'General'
            }));
            setOrders(enrichedOrders);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshData();
        window.addEventListener('ri_data_changed', refreshData);
        return () => window.removeEventListener('ri_data_changed', refreshData);
    }, [refreshData]);

    if (user?.role !== 'admin') {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied: Admin Only</div>;
    }

    const updateStatus = async (orderId, status, extraFields = {}) => {
        const { error } = await supabase.from('orders').update({
            status: status,
            updated_at: new Date().toISOString(),
            ...extraFields
        }).eq('order_id', orderId);

        if (error) {
            console.error("Failed to update status", error);
        } else {
            refreshData();
        }
    };

    const handleApprove = (id) => updateStatus(id, 'APPROVED');
    const handleReject = (id) => updateStatus(id, 'REJECTED');

    const openDispatchModal = (order) => {
        setSelectedOrder(order);
        setModalAction('dispatch');
        setFormData({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });
    };

    const openDeliverModal = (order) => {
        setSelectedOrder(order);
        setModalAction('deliver');
        setFormData({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });
    };

    const submitModal = async () => {
        if (modalAction === 'dispatch') {
            await updateStatus(selectedOrder.order_id, 'DISPATCHED', {
                vehicle_num: formData.vehicleNo,
                expected_delivery: formData.expectedDate,
                // Backwards compatibility kept for now
                dispatch_info: {
                    vehicleNo: formData.vehicleNo,
                    expectedDate: formData.expectedDate,
                    by: user.id
                }
            });
        } else if (modalAction === 'deliver') {
            await updateStatus(selectedOrder.order_id, 'DELIVERED', {
                received_by: formData.receivedBy,
                note: formData.proof,
                // Backwards compatibility kept for now
                delivery_info: {
                    proof: formData.proof,
                    receivedBy: formData.receivedBy,
                    by: user.id
                }
            });
        }
        setModalAction(null);
        setSelectedOrder(null);
    };

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case 'pending': return orders.filter(o => o.status === 'PENDING');
            case 'approved': return orders.filter(o => o.status === 'APPROVED');
            case 'dispatched': return orders.filter(o => o.status === 'DISPATCHED');
            case 'delivered': return orders.filter(o => o.status === 'DELIVERED');
            case 'cancelled': return orders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED');
            default: return [];
        }
    }, [orders, activeTab]);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'APPROVED': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
            case 'DISPATCHED': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                {[
                    { id: 'pending', label: 'Approval Pending' },
                    { id: 'approved', label: 'Dispatch Pending' },
                    { id: 'dispatched', label: 'Delivery Pending' },
                    { id: 'delivered', label: 'Delivered Orders' },
                    { id: 'cancelled', label: 'Cancelled / Rejected' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 capitalize font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                <div className="space-y-5">
                    {loading ? (
                        <SkeletonLoader type="list" count={5} />
                    ) : (
                        <>
                            {filteredOrders.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <PackageCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium tracking-tight">No orders in this status.</p>
                                </div>
                            )}
                            {filteredOrders.map(order => {
                                const isHighlighted = highlightedOrder === order.order_id;
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
                                    <div className="p-5 md:flex gap-6 items-start">
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
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(order.status)} animate-fade-in`}>
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
                                                <div className="flex flex-col gap-1.5 text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={13} />
                                                        <span className="text-xs font-semibold">Created: {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                    {order.updated_at && (
                                                        <div className="flex items-center gap-1.5 text-red-400">
                                                            <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Updated: {new Date(order.updated_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
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

                                        {/* Dispatch/Delivery Info */}
                                        {(order.vehicle_num || order.received_by || order.dispatch_info || order.delivery_info) && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(order.vehicle_num || order.dispatch_info) && (
                                                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                                        <p className="text-[10px] uppercase font-black text-blue-600 tracking-widest mb-2 flex items-center gap-1">
                                                            <Truck size={10} /> Dispatch Details
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                            <div>
                                                                <p className="text-slate-400 uppercase font-bold text-[9px]">Vehicle No</p>
                                                                <p className="text-slate-900 font-black tracking-tight">
                                                                    {order.vehicle_num || order.dispatch_info?.vehicleNo}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 uppercase font-bold text-[9px]">Exp. Date</p>
                                                                <p className="text-slate-900 font-black tracking-tight">
                                                                    {order.expected_delivery || order.dispatch_info?.expectedDate}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {(order.received_by || order.delivery_info) && (
                                                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                                        <p className="text-[10px] uppercase font-black text-purple-600 tracking-widest mb-2 flex items-center gap-1">
                                                            <PackageCheck size={10} /> Delivery Details
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                            <div>
                                                                <p className="text-slate-400 uppercase font-bold text-[9px]">Received By</p>
                                                                <p className="text-slate-900 font-black tracking-tight">
                                                                    {order.received_by || order.delivery_info?.receivedBy}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-400 uppercase font-bold text-[9px]">Note/Proof</p>
                                                                <p className="text-slate-900 font-black tracking-tight line-clamp-1">
                                                                    {order.note || order.delivery_info?.proof}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Right: Actions */}
                                        <div className="mt-4 md:mt-0 md:pl-6 md:border-l border-slate-100 flex flex-row md:flex-col gap-2 shrink-0 self-center">
                                            {activeTab === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(order.order_id)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200/50 hover:bg-green-700 hover:-translate-y-0.5 transition-all">
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button onClick={() => handleReject(order.order_id)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-rose-50 hover:text-rose-600 transition-all">
                                                        <X size={16} /> Reject
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'approved' && (
                                                <button onClick={() => openDispatchModal(order)} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                                                    <Truck size={18} /> Dispatch
                                                </button>
                                            )}
                                            {activeTab === 'dispatched' && (
                                                <button onClick={() => openDeliverModal(order)} className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200/50 hover:bg-purple-700 hover:-translate-y-0.5 transition-all">
                                                    <PackageCheck size={18} /> Mark Delivered
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Overlay */}
            {modalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {modalAction === 'dispatch' ? 'Dispatch Order' : 'Confirm Delivery'}
                        </h3>

                        <div className="space-y-4">
                            {modalAction === 'dispatch' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Vehicle Number</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="e.g. MH-12-AB-1234"
                                            value={formData.vehicleNo}
                                            onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Expected Delivery</label>
                                        <input
                                            type="date"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            value={formData.expectedDate}
                                            onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {modalAction === 'deliver' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Received By</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Customer Name"
                                            value={formData.receivedBy}
                                            onChange={e => setFormData({ ...formData, receivedBy: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1">Proof (Image URL / Note)</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="URL or Note"
                                            value={formData.proof}
                                            onChange={e => setFormData({ ...formData, proof: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setModalAction(null)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                <button onClick={submitModal} className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrder;
