import React, { useState, useEffect } from 'react';
import { LS, createComplaint, updateComplaintStatus } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, Check, RefreshCw } from 'lucide-react';

const Complaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [description, setDescription] = useState('');
    const [productId, setProductId] = useState('');

    const loadData = () => {
        if (!user) return;
        const all = LS.get('ri_complaints');
        const mine = user.role === 'admin' ? all : all.filter(c => c.customer_id === user.id);
        setComplaints(mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setProducts(LS.get('ri_products'));
    };

    useEffect(() => {
        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!productId || !description) return;

        const newComplaint = {
            complaint_id: "C" + Date.now().toString().slice(-6),
            customer_id: user.id,
            product_id: productId,
            description: description,
            images: [],
            status: "PENDING",
            createdAt: new Date().toISOString(),
            history: [{ status: "PENDING", at: new Date().toISOString() }]
        };

        createComplaint(newComplaint);
        setDescription('');
        setProductId('');
        setShowForm(false);
    };

    const handleStatusUpdate = (id, newStatus) => {
        updateComplaintStatus(id, newStatus, { by: user.id, note: 'User updated status' });
        // The event listener will reload data, but for better UX we could trigger loadData immediately if needed.
        // The LSHelpers usually dispatches the event.
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Support & Complaints</h2>
                    <p className="text-slate-500 text-sm">We're here to help you</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all font-medium"
                >
                    {showForm ? 'Cancel' : 'New Complaint'}
                </button>
            </div>

            {showForm && (
                <div className="glass-panel p-6 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Submit a New Complaint</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                            <select
                                value={productId}
                                onChange={e => setProductId(e.target.value)}
                                className="w-full glass-input"
                                required
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.product_id} value={p.product_id}>{p.name} ({p.product_id})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full glass-input h-32 resize-none"
                                placeholder="Please describe your issue..."
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md">
                                <Send size={18} />
                                <span>Submit Ticket</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {complaints.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No complaints found.</p>
                ) : (
                    complaints.map(complaint => (
                        <div key={complaint.complaint_id} className="glass-card p-6 border-l-4 border-l-transparent hover:border-l-red-500 transition-all">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-full h-fit flex-shrink-0 ${complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {complaint.status === 'RESOLVED' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-800 text-lg">Ticket #{complaint.complaint_id}</h4>
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Prod: {complaint.product_id}</span>
                                        </div>
                                        <p className="text-slate-600 mb-3">{complaint.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                            {complaint.history.length > 1 && (
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Clock size={12} /> Last Update: {new Date(complaint.history[complaint.history.length - 1].at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        complaint.status === 'IN-PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                        }`}>
                                        {complaint.status}
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {complaint.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(complaint.complaint_id, 'RESOLVED')}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                            >
                                                <Check size={14} /> Mark Resolved
                                            </button>
                                        )}
                                        {complaint.status === 'RESOLVED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(complaint.complaint_id, 'PENDING')}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                                            >
                                                <RefreshCw size={14} /> Re-open
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Complaints;
