import React, { useState, useEffect } from 'react';
import { LS, createOrder } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, CreditCard, ChevronRight, Plus, Trash2, ShoppingCart, Tag } from 'lucide-react';

const PlaceOrder = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Data
    const [products, setProducts] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Cart
    const [cart, setCart] = useState([]);

    // Selection Form
    const [selectedProductId, setSelectedProductId] = useState('');
    const [qty, setQty] = useState(1);
    const [selectedSchemeId, setSelectedSchemeId] = useState('');

    // Checkout Form
    const [address, setAddress] = useState('123, Industrial Area, Main Road, Pune');
    const [paymentType, setPaymentType] = useState('COD');

    useEffect(() => {
        setProducts(LS.get('ri_products'));
        setSchemes(LS.get('ri_schemes'));
        if (location.state?.preselectedProductId) {
            setSelectedProductId(location.state.preselectedProductId);
        }
    }, [location.state]);

    // Select product handler
    const handleSelectProduct = (id) => {
        setSelectedProductId(id);
        setQty(1);
        setSelectedSchemeId('');
    };

    const addToCart = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.product_id === selectedProductId);

        // Calculate item total
        const scheme = schemes.find(s => s.scheme_id === selectedSchemeId);
        const gross = product.price * qty;
        const discount = scheme ? (gross * scheme.discountPercent / 100) : 0;
        const final = gross - discount;

        const item = {
            id: Date.now(), // temp id for cart
            product,
            qty: Number(qty),
            scheme,
            finalAmount: final
        };

        setCart([...cart, item]);
        // Reset selection
        setSelectedProductId('');
        setQty(1);
        setSelectedSchemeId('');
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        // Create an order for each item in cart
        cart.forEach(item => {
            const order = {
                order_id: 'O' + Date.now() + Math.floor(Math.random() * 100),
                customer_id: user.id,
                product_id: item.product.product_id,
                quantity: item.qty,
                amount: item.finalAmount,
                address,
                paymentType,
                scheme_id: item.scheme?.scheme_id || null,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                history: [{ status: 'PENDING', at: new Date().toISOString(), by: user.id }]
            };
            createOrder(order);
        });

        alert(`Successfully placed ${cart.length} orders!`);
        navigate('/orders');
    };

    const selectedProduct = products.find(p => p.product_id === selectedProductId);

    // Filter Schemes for selected product
    const availableSchemes = schemes.filter(s => {
        const now = new Date().toISOString();
        if (s.validTo < now || s.validFrom > now) return false;
        if (s.product_ids && selectedProductId && !s.product_ids.includes(selectedProductId)) return false;
        return true;
    });

    // Calculations for Selection
    const currentPrice = selectedProduct ? selectedProduct.price : 0;
    const currentGross = currentPrice * qty;
    const currentScheme = availableSchemes.find(s => s.scheme_id === selectedSchemeId);
    const currentDiscount = currentScheme ? (currentGross * currentScheme.discountPercent / 100) : 0;
    const currentFinal = Math.max(0, currentGross - currentDiscount);

    // Cart Total
    const cartTotal = cart.reduce((sum, item) => sum + item.finalAmount, 0);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] animate-fade-in-up">
            {/* Left: Product Selection */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden max-h-[800px]">
                <div className="p-4 border-b border-slate-100 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">1. Select Products</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full glass-input pl-10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredProducts.map(product => (
                        <div
                            key={product.product_id}
                            onClick={() => handleSelectProduct(product.product_id)}
                            className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all ${selectedProductId === product.product_id
                                ? 'bg-red-50 border-red-500 shadow-md ring-1 ring-red-500'
                                : 'bg-white border-slate-100 hover:shadow-md hover:border-slate-300'
                                }`}
                        >
                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-slate-200" onError={(e) => { e.target.src = 'https://placehold.co/100' }} />
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 text-sm">{product.name}</h4>
                                <p className="text-xs text-slate-500">{product.product_id}</p>
                            </div>
                            <span className="font-bold text-slate-900">₹{product.price}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full lg:w-[500px] flex flex-col gap-4">

                {/* Add Item Panel */}
                <div className="glass-panel p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Add to Cart</h2>
                    {!selectedProduct ? (
                        <div className="text-center text-slate-400 py-4">
                            <p>Select a product to add it to your order</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-3 items-center">
                                <img src={selectedProduct.image} className="w-12 h-12 rounded object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100' }} />
                                <div>
                                    <h4 className="font-bold text-slate-800">{selectedProduct.name}</h4>
                                    <p className="text-xs text-slate-500">₹{selectedProduct.price} / unit</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Qty</label>
                                    <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="glass-input w-full" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Scheme</label>
                                    <select value={selectedSchemeId} onChange={e => setSelectedSchemeId(e.target.value)} className="glass-input w-full text-sm">
                                        <option value="">None</option>
                                        {availableSchemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.name} ({s.discountPercent}%)</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Total: ₹{currentFinal.toLocaleString()}</span>
                                <button onClick={addToCart} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Summary & Checkout */}
                <div className="glass-panel p-6 flex-1 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ShoppingCart size={20} /> Your Cart ({cart.length})
                    </h2>

                    <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar min-h-[150px]">
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <img src={item.product.image} className="w-10 h-10 rounded object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100' }} />
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.product.name}</h4>
                                            <p className="text-xs text-slate-500">Qty: {item.qty} • ₹{item.finalAmount}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Delivery Address</label>
                                <textarea value={address} onChange={e => setAddress(e.target.value)} className="glass-input w-full h-16 resize-none text-sm"></textarea>
                            </div>

                            <div className="flex gap-2">
                                {['COD', 'PREPAID'].map(type => (
                                    <label key={type} className={`flex-1 cursor-pointer border rounded-lg p-2 text-center text-xs font-bold transition-all ${paymentType === type ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200'}`}>
                                        <input type="radio" value={type} checked={paymentType === type} onChange={() => setPaymentType(type)} className="hidden" />
                                        {type}
                                    </label>
                                ))}
                            </div>

                            <button onClick={handleCheckout} className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2">
                                Pay ₹{cartTotal.toLocaleString()} & Order
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceOrder;
