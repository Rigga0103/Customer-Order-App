import React, { useState, useEffect } from 'react';
import { X, Plus, ShoppingCart, Package, Loader2, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const AddToCartModal = ({ product, onClose, onAdded }) => {
    const { addToCart } = useCart();
    const [schemes, setSchemes] = useState([]);
    const [qtyStr, setQtyStr] = useState('1');
    const [selectedSchemeId, setSelectedSchemeId] = useState('');
    const [couponInput, setCouponInput] = useState('');
    const [manualScheme, setManualScheme] = useState(null);
    const [loadingSchemes, setLoadingSchemes] = useState(true);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');

    // Reset qty & scheme whenever a new product is opened
    useEffect(() => {
        setQtyStr('1');
        setSelectedSchemeId('');
        setCouponInput('');
        setManualScheme(null);
        setCouponError('');
    }, [product]);

    useEffect(() => {
        const fetchSchemes = async () => {
            setLoadingSchemes(true);
            const now = new Date().toISOString();
            const { data } = await supabase
                .from('schemes')
                .select('*')
                .lte('valid_from', now)
                .gte('valid_to', now);
            if (data) {
                const available = data.filter(s =>
                    !s.applicable_products ||
                    s.applicable_products.includes(product.product_id)
                );
                setSchemes(available);
            }
            setLoadingSchemes(false);
        };
        if (product) fetchSchemes();
    }, [product]);

    const handleCouponLookup = async (code) => {
        if (!code) {
            setManualScheme(null);
            setCouponError('');
            return;
        }
        setVerifyingCoupon(true);
        setCouponError('');
        const now = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('schemes')
                .select('*')
                .eq('scheme_id', code)
                .lte('valid_from', now)
                .gte('valid_to', now)
                .single();

            if (error || !data) {
                setManualScheme(null);
                setCouponError('Invalid or expired code');
            } else {
                // Check applicability
                if (data.applicable_products && !data.applicable_products.includes(product.product_id)) {
                    setManualScheme(null);
                    setCouponError('Not applicable to this product');
                } else {
                    setManualScheme(data);
                    setSelectedSchemeId(data.scheme_id);
                    setCouponError('');
                }
            }
        } catch (err) {
            setCouponError('Lookup failed');
        } finally {
            setVerifyingCoupon(false);
        }
    };

    if (!product) return null;

    const parsedQty = parseInt(qtyStr, 10);
    const validQty = !isNaN(parsedQty) && parsedQty > 0;
    const gross = validQty ? product.price * parsedQty : 0;

    // Prioritize manual scheme if it matches the selected ID, else look in list
    const selectedScheme = (manualScheme && manualScheme.scheme_id === selectedSchemeId)
        ? manualScheme
        : schemes.find(s => s.scheme_id === selectedSchemeId);

    const discount = selectedScheme ? (gross * selectedScheme.discount_percent / 100) : 0;
    const finalAmount = Math.max(0, gross - discount);

    const handleAdd = () => {
        if (!validQty) return;
        addToCart(product, parsedQty, selectedScheme || null);
        if (onAdded) onAdded();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-rose-500" />
                        Add to Cart
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Product Preview */}
                    <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <img
                            src={product.image_url || product.image || 'https://placehold.co/100'}
                            alt={product.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white"
                            onError={e => { e.target.src = 'https://placehold.co/100'; }}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-base leading-tight">{product.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5 font-mono">{product.product_id}</p>
                            <p className="text-sm font-semibold text-slate-700 mt-1">₹{product.price} / unit</p>
                        </div>
                    </div>
                    {product.stock <= 10 && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={18} />
                            Currently out of stock. Please check back later!
                        </div>
                    )}

                    {/* Qty & Scheme */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quantity</label>
                            <input
                                type="number"
                                min="0"
                                value={qtyStr}
                                onChange={e => setQtyStr(e.target.value)}
                                onBlur={() => {
                                    // On blur, if empty or invalid, reset to 1
                                    const n = parseInt(qtyStr, 10);
                                    if (isNaN(n) || n < 1) setQtyStr('1');
                                }}
                                className="glass-input w-full text-base font-medium"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Scheme / Coupon</label>
                            {loadingSchemes ? (
                                <div className="glass-input flex items-center gap-2 text-slate-400 text-sm h-[44px]">
                                    <Loader2 size={14} className="animate-spin" /> Loading...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <input
                                            list="schemes-list"
                                            value={couponInput}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCouponInput(val);
                                                // If value matches a scheme in the list, select it
                                                const matched = schemes.find(s => s.name === val || s.scheme_id === val);
                                                if (matched) {
                                                    setSelectedSchemeId(matched.scheme_id);
                                                    setCouponError('');
                                                } else {
                                                    // Allow manual lookup on blur or "Apply"
                                                    if (!val) setSelectedSchemeId('');
                                                }
                                            }}
                                            onBlur={() => {
                                                if (couponInput && !schemes.find(s => s.name === couponInput || s.scheme_id === couponInput)) {
                                                    handleCouponLookup(couponInput);
                                                }
                                            }}
                                            placeholder="Enter code or select..."
                                            className={`glass-input w-full text-sm h-[44px] pr-10 ${couponError ? 'border-rose-300 ring-rose-100' : ''}`}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {verifyingCoupon ? (
                                                <Loader2 size={14} className="animate-spin text-slate-400" />
                                            ) : (
                                                <Tag size={14} className="text-slate-400 group-hover:text-slate-500" />
                                            )}
                                        </div>
                                        <datalist id="schemes-list">
                                            {schemes.map(s => (
                                                <option key={s.scheme_id} value={s.scheme_id}>
                                                    {s.name} ({s.discount_percent}% off)
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                    {couponError && (
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight px-1">
                                            {couponError}
                                        </p>
                                    )}
                                    {selectedScheme && !couponError && (
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight px-1">
                                            Applied: {selectedScheme.name} ({selectedScheme.discount_percent}% off)
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-0.5">Item Total</p>
                            <p className="text-2xl font-bold text-slate-900">₹{finalAmount.toLocaleString()}</p>
                            {discount > 0 && (
                                <p className="text-xs font-medium text-emerald-500 mt-0.5">
                                    You save ₹{discount.toLocaleString()}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={!validQty || product.stock <= 10}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${validQty && product.stock > 10
                                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {product.stock <= 10 ? 'Out of Stock' : <><Plus size={16} /> Add to Cart</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToCartModal;
