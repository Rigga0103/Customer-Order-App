import React, { useState, useEffect } from 'react';
import { LS } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { Tag, Calendar, Gift, Plus, X, Check, History, Trash2 } from 'lucide-react';

const Schemes = () => {
    const { user } = useAuth();
    const [schemes, setSchemes] = useState([]);
    const [products, setProducts] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        discountPercent: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
    });

    const [selectedProductIds, setSelectedProductIds] = useState([]);

    const refreshData = () => {
        setSchemes(LS.get('ri_schemes'));
        setProducts(LS.get('ri_products'));
    };

    useEffect(() => {
        refreshData();
    }, []);

    const toggleProductSelection = (pid) => {
        setSelectedProductIds(prev =>
            prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
        );
    };

    const handleDeactivate = (id) => {
        if (!window.confirm("Are you sure you want to deactivate this scheme? It will move to history.")) return;

        const current = LS.get('ri_schemes');
        const idx = current.findIndex(s => s.scheme_id === id);
        if (idx > -1) {
            // Set validTo to yesterday to expire it
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            current[idx].validTo = yesterday.toISOString().split('T')[0];
            LS.set('ri_schemes', current);
            refreshData();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.discountPercent || !formData.validTo) return;

        const newScheme = {
            scheme_id: 'S' + Date.now().toString().slice(-4),
            name: formData.name,
            discountPercent: Number(formData.discountPercent),
            validFrom: formData.validFrom,
            validTo: formData.validTo,
            product_ids: selectedProductIds
        };

        const current = LS.get('ri_schemes');
        current.unshift(newScheme);
        LS.set('ri_schemes', current);

        refreshData();
        setIsModalOpen(false);
        setFormData({ name: '', discountPercent: '', validFrom: new Date().toISOString().split('T')[0], validTo: '' });
        setSelectedProductIds([]);
    };

    // Filter Logic
    const today = new Date().toISOString().split('T')[0];
    const activeSchemes = schemes.filter(s => s.validTo >= today);
    const expiredSchemes = schemes.filter(s => s.validTo < today);

    const displayedSchemes = showHistory ? expiredSchemes : activeSchemes;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {showHistory ? 'Scheme History' : 'Active Schemes & Offers'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {showHistory ? 'Past deals and expired offers' : 'Exclusive deals just for you'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium border ${showHistory ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <History size={18} /> {showHistory ? 'Show Active' : 'View History'}
                    </button>

                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium"
                        >
                            <Plus size={18} /> Add Scheme
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedSchemes.length === 0 ? (
                    <div className="col-span-full text-center py-10">
                        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Tag size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500">No {showHistory ? 'expired' : 'active'} schemes found.</p>
                    </div>
                ) : (
                    displayedSchemes.map(scheme => (
                        <div key={scheme.scheme_id} className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group ${showHistory ? 'bg-slate-100 grayscale hover:grayscale-0' : 'bg-gradient-to-br from-red-500 to-rose-600 hover:shadow-xl'}`}>
                            {!showHistory && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>}

                            <div className={`relative p-6 h-full flex flex-col justify-between ${showHistory ? 'text-slate-600' : 'text-white'}`}>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${showHistory ? 'bg-white' : 'bg-white/20 backdrop-blur-md'}`}>
                                                <Gift size={20} className={showHistory ? 'text-slate-400' : 'text-white'} />
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${showHistory ? 'bg-slate-200 text-slate-500' : 'bg-white/20 backdrop-blur-md'}`}>
                                                {showHistory ? 'Expired' : 'Active'}
                                            </span>
                                        </div>
                                        {user?.role === 'admin' && !showHistory && (
                                            <button
                                                onClick={() => handleDeactivate(scheme.scheme_id)}
                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                                title="Deactivate Scheme"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${showHistory ? 'text-slate-800' : ''}`}>{scheme.name}</h3>
                                    <p className={`text-sm mb-4 ${showHistory ? 'text-slate-500' : 'text-white/90'}`}>Get {scheme.discountPercent}% Off on selected products!</p>
                                    <div className="flex flex-wrap gap-1 mb-4 max-h-20 overflow-y-auto custom-scrollbar">
                                        {scheme.product_ids?.map((pid, idx) => (
                                            <span key={idx} className={`text-[10px] px-2 py-1 rounded ${showHistory ? 'bg-slate-200 text-slate-600' : 'bg-white/10'}`}>{pid}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`pt-6 border-t ${showHistory ? 'border-slate-200' : 'border-white/20'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${showHistory ? 'text-slate-400' : 'text-white/80'}`}>
                                            <Calendar size={14} />
                                            <span>Valid until {scheme.validTo}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/90 text-slate-800 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-red-600" />
                                            <span className="font-bold font-mono tracking-widest">{scheme.scheme_id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 uppercase">Code</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Scheme Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Add New Scheme</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Scheme Name</label>
                                <input
                                    type="text"
                                    className="glass-input w-full"
                                    placeholder="e.g. Monsoon Sale"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Discount %</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        placeholder="10"
                                        value={formData.discountPercent}
                                        onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Valid To</label>
                                    <input
                                        type="date"
                                        className="glass-input w-full"
                                        value={formData.validTo}
                                        onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Multi-select Dropdown */}
                            <div className="relative">
                                <label className="text-sm font-medium text-slate-700 block mb-1">Select Products</label>
                                <div
                                    className="glass-input w-full min-h-[42px] flex flex-wrap gap-1 items-center cursor-pointer"
                                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                                >
                                    {selectedProductIds.length === 0 ? (
                                        <span className="text-slate-400">Select products...</span>
                                    ) : (
                                        selectedProductIds.map(pid => (
                                            <span key={pid} className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium border border-red-100 flex items-center gap-1">
                                                {pid}
                                                <X size={12} className="cursor-pointer hover:text-red-800" onClick={(e) => { e.stopPropagation(); toggleProductSelection(pid); }} />
                                            </span>
                                        ))
                                    )}
                                </div>

                                {isProductDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                                        {products.map(p => (
                                            <div
                                                key={p.product_id}
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                                                onClick={() => { toggleProductSelection(p.product_id); }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedProductIds.includes(p.product_id) ? 'bg-red-600 border-red-600' : 'border-slate-300'}`}>
                                                        {selectedProductIds.includes(p.product_id) && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                                                        <p className="text-xs text-slate-500">{p.product_id}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-900">₹{p.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-2">
                                Create Scheme
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schemes;
