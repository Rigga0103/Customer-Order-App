import React, { useState, useEffect } from 'react';
import { LS, updateOrderStatus, updateComplaintStatus } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { Check, X, Truck, PackageCheck, AlertCircle, Calendar, FileText } from 'lucide-react';

const AdminPending = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, dispatched, complaints
    const [orders, setOrders] = useState([]);
    const [complaints, setComplaints] = useState([]);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'dispatch', 'deliver'
    const [formData, setFormData] = useState({ vehicleNo: '', expectedDate: '', proof: '', receivedBy: '' });

    const refreshData = () => {
        setOrders(LS.get('ri_orders'));
        setComplaints(LS.get('ri_complaints'));
    };

    useEffect(() => {
        refreshData();
        const handler = () => refreshData();
        window.addEventListener('ri_data_changed', handler);
        return () => window.removeEventListener('ri_data_changed', handler);
    }, []);

    if (user?.role !== 'admin') {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied: Admin Only</div>;
    }

    const handleApprove = (id) => updateOrderStatus(id, 'APPROVED', { by: user.id });
    const handleReject = (id) => updateOrderStatus(id, 'REJECTED', { by: user.id, reason: 'Admin Rejected' });

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

    const submitModal = () => {
        if (modalAction === 'dispatch') {
            updateOrderStatus(selectedOrder.order_id, 'DISPATCHED', {
                vehicleNo: formData.vehicleNo,
                expectedDate: formData.expectedDate,
                by: user.id
            });
        } else if (modalAction === 'deliver') {
            updateOrderStatus(selectedOrder.order_id, 'DELIVERED', {
                proof: formData.proof,
                receivedBy: formData.receivedBy,
                by: user.id
            });
        }
        setModalAction(null);
        setSelectedOrder(null);
    };

    const complaintAction = (id, status) => {
        updateComplaintStatus(id, status, { by: user.id });
    };

    const filteredOrders = () => {
        switch (activeTab) {
            case 'pending': return orders.filter(o => o.status === 'PENDING');
            case 'approved': return orders.filter(o => o.status === 'APPROVED');
            case 'dispatched': return orders.filter(o => o.status === 'DISPATCHED');
            default: return [];
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-slate-800">Admin Console</h1>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                {['pending', 'approved', 'dispatched', 'complaints'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab
                            ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'complaints' ? 'Complaints' : `${tab} Orders`}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'complaints' ? (
                    <div className="space-y-4">
                        {complaints.length === 0 && <p className="text-slate-500">No complaints found.</p>}
                        {complaints.map(c => (
                            <div key={c.complaint_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs rounded-full border ${c.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'}`}>{c.status}</span>
                                        <span className="text-sm font-semibold text-slate-900">{c.complaint_id}</span>
                                    </div>
                                    <p className="text-slate-700 font-medium">{c.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">Prod: {c.product_id} | User: {c.customer_id}</p>
                                </div>
                                <div className="flex gap-2">
                                    {c.status === 'PENDING' && (
                                        <button onClick={() => complaintAction(c.complaint_id, 'IN-PROGRESS')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-200 hover:bg-blue-100">Start</button>
                                    )}
                                    {c.status !== 'RESOLVED' && (
                                        <button onClick={() => complaintAction(c.complaint_id, 'RESOLVED')} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium border border-green-200 hover:bg-green-100">Resolve</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders().length === 0 && <p className="text-slate-500">No orders in this status.</p>}
                        {filteredOrders().map(order => (
                            <div key={order.order_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:flex items-center justify-between group hover:border-red-200 transition-colors">
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-slate-900">{order.order_id}</span>
                                        <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">
                                        Product ID: <span className="font-medium">{order.product_id}</span> × {order.quantity}
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        Amount: <span className="font-bold">₹{order.amount}</span> ({order.paymentType})
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">User: {order.customer_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeTab === 'pending' && (
                                        <>
                                            <button onClick={() => handleApprove(order.order_id)} className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-200 hover:bg-green-100">
                                                <Check size={16} /> Approve
                                            </button>
                                            <button onClick={() => handleReject(order.order_id)} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100">
                                                <X size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {activeTab === 'approved' && (
                                        <button onClick={() => openDispatchModal(order)} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100">
                                            <Truck size={16} /> Dispatch
                                        </button>
                                    )}
                                    {activeTab === 'dispatched' && (
                                        <button onClick={() => openDeliverModal(order)} className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-100">
                                            <PackageCheck size={16} /> Mark Delivered
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {modalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {modalAction === 'dispatch' ? 'Disptach Order' : 'Confirm Delivery'}
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

export default AdminPending;
