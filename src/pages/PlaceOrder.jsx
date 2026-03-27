import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, CreditCard, Trash2, ShoppingCart, Heart, Package, MapPin, ChevronRight } from 'lucide-react';
import AddToCartModal from '../components/AddToCartModal';
import SkeletonLoader from '../components/SkeletonLoader';

const PlaceOrder = () => {
    const { user } = useAuth();
    const { cart, removeFromCart, updateQty, clearCart } = useCart();
    const location = useLocation();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('favorites');
    const [cartModalProduct, setCartModalProduct] = useState(null);
    const [address, setAddress] = useState('');
    const [paymentType, setPaymentType] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showAddressModal, setShowAddressModal] = useState(false);

    const [addressFields, setAddressFields] = useState({
        id: null,
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        // address_type: 'home'
    });

    useEffect(() => {
        if (location.state?.openCartTab) setActiveTab('cart');
    }, [location.state]);

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                // Fetch favorites first, then only fetch those products (Bug #7 fix)
                const { data: favData } = await supabase
                    .from('favorites').select('product_id').eq('user_id', user.id);

                if (favData && favData.length > 0) {
                    const favIds = favData.map(f => f.product_id);
                    setFavoriteIds(new Set(favIds));
                    const { data: pData } = await supabase
                        .from('products')
                        .select('*')
                        .in('product_id', favIds);
                    if (pData) setProducts(pData);
                } else {
                    setFavoriteIds(new Set());
                    setProducts([]);
                }

                const { data: addressData } = await supabase
                    .from('user_addresses').select('*')
                    .eq('user_id', user.id).eq('is_default', true).maybeSingle();

                if (addressData) {
                    setAddress(`${addressData.address_line1 || ''}, ${addressData.city || ''}, ${addressData.state || ''} - ${addressData.postal_code || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ','));
                    setAddressFields({
                        id: addressData.id,
                        full_name: addressData.full_name || '',
                        phone: addressData.phone || '',
                        address_line1: addressData.address_line1 || '',
                        address_line2: addressData.address_line2 || '',
                        landmark: addressData.landmark || '',
                        city: addressData.city || '',
                        state: addressData.state || '',
                        postal_code: addressData.postal_code || '',
                        country: addressData.country || 'India',
                        // address_type: addressData.address_type || 'home'
                    });
                } else if (user?.deliveryAddress) {
                    const a = user.deliveryAddress;
                    setAddress(`${a.address || ''}, ${a.city || ''}, ${a.district || ''}, ${a.state || ''} - ${a.postalCode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ','));
                    setAddressFields(prev => ({ ...prev, address_line1: a.address || '', city: a.city || '', state: a.state || '', postal_code: a.postalCode || '' }));
                }
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleSaveAddress = async () => {
        if (!addressFields.full_name || !addressFields.phone || !addressFields.address_line1 || !addressFields.city || !addressFields.state || !addressFields.postal_code) {
            alert('Please fill out all required fields: Name, Phone, Address Line 1, City, State, Postal Code');
            return;
        }

        const payload = {
            user_id: user.id,
            full_name: addressFields.full_name,
            phone: addressFields.phone,
            address_line1: addressFields.address_line1,
            address_line2: addressFields.address_line2,
            landmark: addressFields.landmark,
            city: addressFields.city,
            state: addressFields.state,
            postal_code: addressFields.postal_code,
            country: addressFields.country || 'India',
            // address_type: addressFields.address_type || 'home',
            is_default: true
        };

        if (addressFields.id) {
            payload.id = addressFields.id;
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address to database. Try again.');
            return;
        }

        if (data) {
            setAddressFields({
                id: data.id,
                full_name: data.full_name || '',
                phone: data.phone || '',
                address_line1: data.address_line1 || '',
                address_line2: data.address_line2 || '',
                landmark: data.landmark || '',
                city: data.city || '',
                state: data.state || '',
                postal_code: data.postal_code || '',
                country: data.country || 'India',
                // address_type: data.address_type || 'home'
            });
        }

        const mergedAddress = [
            addressFields.address_line1,
            addressFields.address_line2,
            addressFields.landmark,
            addressFields.city,
            addressFields.state,
            addressFields.postal_code
        ]
            .filter(Boolean)
            .join(', ');

        setAddress(mergedAddress);
        setShowAddressModal(false);
    };
    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsSubmitting(true);
        const orderDocs = cart.map((item, index) => ({  // Bug #13: include index to prevent ID collision
            order_id: 'O' + Date.now().toString().slice(-6) + index.toString().padStart(2, '0') + Math.floor(Math.random() * 100),
            customer_id: user.id,
            product_id: item.product.product_id,
            quantity: item.qty,
            amount: item.finalAmount,
            address,
            payment_type: paymentType,
            scheme_id: item.scheme?.scheme_id || null,
            status: 'PENDING',
            created_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('orders').insert(orderDocs);
        setIsSubmitting(false);
        if (error) { alert('Failed to place order. Try again.'); return; }
        clearCart();
        alert(`Successfully placed ${cart.length} order(s)!`);
        navigate('/orders');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.finalAmount, 0);

    const toggleFavorite = async (e, productId) => {
        e.stopPropagation();
        // Optimistically remove from UI
        setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });
        // Remove from Supabase
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
        if (error) {
            console.error('Error removing favorite:', error);
            // Revert on failure
            setFavoriteIds(prev => new Set([...prev, productId]));
        }
    };

    const favoriteProducts = products.filter(p => favoriteIds.has(p.product_id));
    const filteredFavorites = favoriteProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-0 min-h-[calc(100vh-8rem)] animate-fade-in-up">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                <button
                    className={`px-6 py-3.5 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${activeTab === 'favorites' ? 'text-rose-600 border-rose-500' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    <Heart size={16} className={activeTab === 'favorites' ? 'fill-rose-500 text-rose-500' : ''} />
                    My Favorites
                    {favoriteProducts.length > 0 && (
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{favoriteProducts.length}</span>
                    )}
                </button>
                <button
                    className={`px-6 py-3.5 font-semibold text-sm transition-all focus:outline-none flex items-center gap-2 border-b-2 ${activeTab === 'cart' ? 'text-rose-600 border-rose-500' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-200'}`}
                    onClick={() => setActiveTab('cart')}
                >
                    <ShoppingCart size={16} />
                    Cart
                    {cart.length > 0 && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'cart' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{cart.length}</span>
                    )}
                </button>
            </div>

            {/* ── FAVORITES TAB ── */}
            {activeTab === 'favorites' && (
                <div className="pt-6 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-input pl-9 py-2 text-sm w-full"
                        />
                    </div>

                    {loading ? (
                        <div className="mt-8">
                            <SkeletonLoader type="card" count={4} />
                        </div>
                    ) : filteredFavorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Heart size={48} className="text-slate-200 mb-3" />
                            <p className="font-semibold text-slate-500">No favorites yet</p>
                            <p className="text-sm mt-1">Browse the catalog and heart products you love</p>
                            <button onClick={() => navigate('/all-products')} className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                Browse Catalog <ChevronRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredFavorites.map(product => (
                                <div
                                    key={product.product_id}
                                    className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1"
                                    onClick={() => setCartModalProduct(product)}
                                >
                                    <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                        <img
                                            src={product.image_url || product.image || 'https://placehold.co/400?text=Product'}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={e => { e.target.src = 'https://placehold.co/400?text=Product'; }}
                                        />
                                        {product.category && (
                                            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                                                {product.category}
                                            </div>
                                        )}
                                        {product.stock <= 10 && (
                                            <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-lg z-10 shadow-red-500/30 animate-pulse pointer-events-none">
                                                Out of Stock
                                            </div>
                                        )}
                                        {/* Clickable heart — removes from favorites */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, product.product_id)}
                                            className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded-full shadow-sm z-20 transition-all hover:scale-110"
                                            title="Remove from favorites"
                                        >
                                            <Heart size={16} className="fill-red-500 text-red-500" />
                                        </button>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="text-base font-bold text-slate-800 leading-tight line-clamp-1 mb-1">{product.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">
                                            {product.description || 'No additional details available.'}
                                        </p>
                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                                <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (product.stock > 10) setCartModalProduct(product); 
                                                }}
                                                disabled={product.stock <= 10}
                                                className={`px-4 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all flex items-center justify-center ${
                                                    product.stock <= 10
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-indigo-900/5 hover:-translate-y-0.5'
                                                }`}
                                            >
                                                {product.stock <= 10 ? 'Out of Stock' : 'Add to cart'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── CART TAB ── */}
            {activeTab === 'cart' && (
                <div className="pt-6 flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left: Cart Items */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-slate-400" />
                            Cart Items
                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cart.length}</span>
                        </h2>

                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <ShoppingBag size={48} className="text-slate-200 mb-4" />
                                <p className="font-semibold text-slate-500">Your cart is empty</p>
                                <p className="text-sm text-slate-400 mt-1">Add some products from your favorites</p>
                                <button onClick={() => setActiveTab('favorites')} className="mt-4 text-sm font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                    My Favorites <ChevronRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 py-4 group">
                                        <img
                                            src={item.product.image_url || item.product.image || 'https://placehold.co/100'}
                                            alt={item.product.name}
                                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100 flex-shrink-0"
                                            onError={e => { e.target.src = 'https://placehold.co/100'; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{item.product.name}</p>
                                            {item.scheme && (
                                                <p className="text-xs text-emerald-500 font-medium mt-0.5">{item.scheme.name} applied</p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-0.5">₹{item.product.price} / unit</p>
                                        </div>
                                        {/* Qty input — same style as modal */}
                                        <div className="flex-shrink-0">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={e => updateQty(item.id, e.target.value)}
                                                className="glass-input w-20 text-base font-medium text-center"
                                            />
                                        </div>
                                        <div className="text-right flex-shrink-0 min-w-[70px]">
                                            <p className="font-bold text-slate-900">₹{item.finalAmount.toLocaleString()}</p>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="mt-1 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Order Summary */}
                    {cart.length > 0 && (
                        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-5">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Order Summary</h3>

                            {/* Price breakdown */}
                            <div className="space-y-2 text-sm">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-slate-500">
                                        <span className="truncate max-w-[160px]">{item.product.name} × {item.qty}</span>
                                        <span className="font-medium text-slate-700">₹{item.finalAmount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                                    <span>Total</span>
                                    <span>₹{cartTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                                    <MapPin size={12} /> Delivery Address
                                </label>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700">
                                    {address || "No address selected"}
                                </div>

                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="mt-2 w-full text-sm font-semibold text-rose-600 border border-rose-200 py-2 rounded-lg hover:bg-rose-50 transition"
                                >
                                    Change Address
                                </button>
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Payment</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['COD'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPaymentType(type)}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${paymentType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {type === 'COD' ? <Package size={14} /> : <CreditCard size={14} />}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                disabled={isSubmitting}
                                onClick={handleCheckout}
                                className={`w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
                            >
                                {isSubmitting ? 'Placing Order...' : `Place Order · ₹${cartTotal.toLocaleString()}`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add to Cart Modal */}
            <AddToCartModal
                product={cartModalProduct}
                onClose={() => setCartModalProduct(null)}
                onAdded={() => { setActiveTab('cart'); }}
            />

            {showAddressModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">

                        <h3 className="text-lg font-bold text-slate-800">
                            Change Delivery Address
                        </h3>

                        <input
                            placeholder="Full Name *"
                            value={addressFields.full_name}
                            onChange={(e) => setAddressFields({ ...addressFields, full_name: e.target.value })}
                            className="glass-input w-full"
                        />

                        <input
                            placeholder="Phone Number *"
                            value={addressFields.phone}
                            onChange={(e) => setAddressFields({ ...addressFields, phone: e.target.value })}
                            className="glass-input w-full"
                        />

                        <input
                            placeholder="Address Line 1 *"
                            value={addressFields.address_line1}
                            onChange={(e) => setAddressFields({ ...addressFields, address_line1: e.target.value })}
                            className="glass-input w-full"
                        />

                        <input
                            placeholder="Address Line 2 (Optional)"
                            value={addressFields.address_line2}
                            onChange={(e) => setAddressFields({ ...addressFields, address_line2: e.target.value })}
                            className="glass-input w-full"
                        />

                        <input
                            placeholder="Landmark (Optional)"
                            value={addressFields.landmark}
                            onChange={(e) => setAddressFields({ ...addressFields, landmark: e.target.value })}
                            className="glass-input w-full"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="City *"
                                value={addressFields.city}
                                onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                                className="glass-input w-full"
                            />

                            <input
                                placeholder="State *"
                                value={addressFields.state}
                                onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })}
                                className="glass-input w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="PIN / Postal Code *"
                                value={addressFields.postal_code}
                                onChange={(e) => setAddressFields({ ...addressFields, postal_code: e.target.value })}
                                className="glass-input w-full"
                            />

                            <input
                                placeholder="Country"
                                value={addressFields.country}
                                onChange={(e) => setAddressFields({ ...addressFields, country: e.target.value })}
                                className="glass-input w-full"
                            />
                        </div>

                        {/* <select
                            value={addressFields.address_type}
                            onChange={(e) => setAddressFields({ ...addressFields, address_type: e.target.value })}
                            className="glass-input w-full bg-slate-50 border-slate-200"
                        >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                        </select> */}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSaveAddress}
                                className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
                            >
                                Save Address
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaceOrder;
