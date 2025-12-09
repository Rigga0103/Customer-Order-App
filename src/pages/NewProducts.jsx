import React, { useState, useEffect } from 'react';
import { LS } from '../utils/LSHelpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Star, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

const NewProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Electrical',
        image: '',
        description: ''
    });

    const loadProducts = () => {
        const all = LS.get('ri_products');
        const sorted = [...all].sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
        setProducts(sorted.slice(0, 20));
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleOrder = (id) => {
        navigate('/place-order', { state: { preselectedProductId: id } });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        const newProduct = {
            product_id: 'P' + Date.now().toString().slice(-4),
            name: formData.name,
            price: Number(formData.price),
            category: formData.category,
            image: formData.image || 'https://placehold.co/400?text=' + encodeURIComponent(formData.name),
            launchDate: new Date().toISOString().split('T')[0],
            description: formData.description
        };

        const currentProducts = LS.get('ri_products');
        currentProducts.push(newProduct); // Add to end or beginning? Usually new products should be found.
        LS.set('ri_products', currentProducts);

        loadProducts();
        setIsModalOpen(false);
        setFormData({ name: '', price: '', category: 'Electrical', image: '', description: '' });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-amber-400 fill-amber-400" /> New Launches
                </h1>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium"
                    >
                        <Plus size={18} /> Launch Product
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(p => (
                    <div key={p.product_id} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="h-48 bg-slate-50 relative overflow-hidden">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://placehold.co/400?text=New+Launch' }} />
                            <span className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">NEW</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-slate-800 truncate" title={p.name}>{p.name}</h3>
                            <p className="text-xs text-slate-500 mb-4">Launched: {p.launchDate}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-slate-900">₹{p.price}</span>
                                <button onClick={() => handleOrder(p.product_id)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm font-medium">
                                    <ShoppingBag size={16} /> Order
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Launch Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Launch New Product</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        className="glass-input w-full"
                                        placeholder="e.g. Heavy Duty Drill"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        placeholder="2500"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Category</label>
                                <select
                                    className="glass-input w-full"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Electrical">Electrical</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Tools">Tools</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Safety">Safety</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Product Image</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {formData.image ? (
                                        <div className="relative h-32 w-full">
                                            <img src={formData.image} alt="Preview" className="h-full w-full object-contain mx-auto" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white font-medium opacity-0 hover:opacity-100 transition-opacity">Change Image</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-400 py-4">
                                            <Upload size={32} className="mb-2" />
                                            <p className="text-sm">Click to upload or drag and drop</p>
                                            <p className="text-xs">PNG, JPG up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                                <textarea
                                    className="glass-input w-full resize-none"
                                    rows="3"
                                    placeholder="Product features and details..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-2">
                                Launch Product
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default NewProducts;
