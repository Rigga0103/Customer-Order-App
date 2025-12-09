import React, { useState, useEffect } from 'react';
import { LS, getNotTriedProducts } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const NotTried = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        if (user) {
            // Need to handle if user.id is what the helper expects. 
            // In LSHelpers/seedData, user.id is 'user' or 'admin'.
            const notTried = getNotTriedProducts(user.id);
            setProducts(notTried);
        }
    }, [user]);

    const handleOrder = (productId) => {
        navigate('/place-order', { state: { preselectedProductId: productId } });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Products Not Tried Before</h1>
                    <p className="text-slate-500 mt-1">Discover items you haven't purchased yet.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-slate-500 mb-2">You have tried all our products!</p>
                        <p className="text-sm text-slate-400">Amazing customer!</p>
                    </div>
                ) : (
                    products.slice(0, 50).map((product) => ( // Limit to 50 to avoid rendering too many
                        <div key={product.product_id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                            <div className="h-40 overflow-hidden relative bg-slate-50">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => { e.target.src = 'https://placehold.co/400?text=No+Image' }}
                                />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">{product.name}</h4>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="font-bold text-lg text-slate-900">₹{product.price}</span>
                                    <button
                                        onClick={() => handleOrder(product.product_id)}
                                        className="flex items-center gap-1 pl-3 pr-2 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-medium text-xs"
                                    >
                                        <span>Try This</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotTried;
