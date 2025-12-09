import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LS } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Filter, Package, Edit3, Trash2, Save, X, Image as ImageIcon, Upload, ShoppingCart } from 'lucide-react';

const AllProducts = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    const handleAddToCart = (productId) => {
        navigate('/place-order', { state: { preselectedProductId: productId } });
    };
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Modal & Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // If null, adding new. If set, editing.
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Hardware',
        description: '',
        image: '',
        stock: 100 // Default stock
    });

    useEffect(() => {
        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, []);

    useEffect(() => {
        filterData();
    }, [products, searchTerm, categoryFilter]);

    const loadData = () => {
        const p = LS.get('ri_products').map(item => ({
            ...item,
            stock: item.stock !== undefined ? item.stock : 100 // Ensure stock exists
        }));
        setProducts(p);
    };

    const filterData = () => {
        let res = products;
        if (categoryFilter !== 'All') {
            res = res.filter(p => p.category === categoryFilter);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.product_id.toLowerCase().includes(lower)
            );
        }
        setFilteredProducts(res);
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

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description || '',
                image: product.image,
                stock: product.stock !== undefined ? product.stock : 100
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                category: 'Hardware',
                description: '',
                image: '',
                stock: 100
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const current = LS.get('ri_products');

        if (editingProduct) {
            // Edit Mode
            const idx = current.findIndex(p => p.product_id === editingProduct.product_id);
            if (idx > -1) {
                current[idx] = {
                    ...current[idx],
                    ...formData,
                    price: Number(formData.price),
                    stock: Number(formData.stock)
                };
                LS.set('ri_products', current);
            }
        } else {
            // Add Mode
            const newId = "P" + (current.length + 101).toString().padStart(3, '0');
            const newProduct = {
                product_id: newId,
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
                launchDate: new Date().toISOString().split('T')[0]
            };
            current.unshift(newProduct);
            LS.set('ri_products', current);
        }

        window.dispatchEvent(new Event('ri_data_changed'));
        setIsModalOpen(false);
    };

    // Only Admin can see this page content in full mode? 
    // User requested "to admin user also show thsis page", implying customers might see it too?
    // "Add a page... to admin user also show thsis page" -> Usually means Admin-only features.
    // But later "Place order page show all products".
    // I'll assume this page is visible to everyone as a 'Catalog', but only Admin can Add/Edit.

    const categories = ['All', ...new Set(products.map(p => p.category))];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">All Products</h2>
                    <p className="text-slate-500 text-sm">Master Catalog & Inventory</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all font-medium"
                    >
                        <Plus size={18} /> Add New Product
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full glass-input pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-slate-500" />
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoryFilter === cat
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <div key={product.product_id} className="glass-card group overflow-hidden flex flex-col">
                        <div className="relative h-48 bg-slate-100 overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                            />
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => handleOpenModal(product)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                >
                                    <Edit3 size={16} />
                                </button>
                            )}
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-white text-[10px] font-bold">
                                {product.category}
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-slate-500 mb-3">{product.product_id}</p>

                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-lg font-bold text-red-600">₹{product.price}</span>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                        Stock: {product.stock}
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(product.product_id)}
                                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-colors"
                                        title="Add to Cart"
                                    >
                                        <ShoppingCart size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Manage Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Product Name</label>
                                <input
                                    type="text"
                                    className="glass-input w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Stock Qty</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
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
                                    {['Electrical', 'Hardware', 'Tools', 'Lighting', 'Accessories', 'Plumbing', 'Paints'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
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
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                                <textarea
                                    className="glass-input w-full h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-2 flex items-center justify-center gap-2">
                                <Save size={18} /> {editingProduct ? 'Update Product' : 'Add Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllProducts;
