import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Filter, Package, AlertCircle, Edit3, Trash2, Save, X, Image as ImageIcon, Upload, ShoppingCart, Loader2, Heart } from 'lucide-react';
import AddToCartModal from '../components/AddToCartModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';


const AllProducts = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [likedProducts, setLikedProducts] = useState(new Set());
    const [cartModalProduct, setCartModalProduct] = useState(null);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Hardware',
        description: '',
        image: '',
        stock: 100
    });
    const [imageFile, setImageFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedCustomerProduct, setSelectedCustomerProduct] = useState(null);

    const toggleLike = async (e, productId) => {
        e.stopPropagation();

        if (!user) {
            alert("Please login to favorite products.");
            return;
        }

        const isCurrentlyLiked = likedProducts.has(productId);

        // Optimistically update UI
        setLikedProducts(prev => {
            const next = new Set(prev);
            if (isCurrentlyLiked) next.delete(productId);
            else next.add(productId);
            return next;
        });

        if (isCurrentlyLiked) {
            // Remove from Supabase
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) {
                console.error("Error removing favorite:", error);
                // Revert SI on error
                setLikedProducts(prev => {
                    const next = new Set(prev);
                    next.add(productId);
                    return next;
                });
            }
        } else {
            // Add to Supabase
            const { error } = await supabase
                .from('favorites')
                .insert([{ user_id: user.id, product_id: productId }]);

            if (error) {
                console.error("Error adding favorite:", error);
                // Revert UI on error
                setLikedProducts(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            }
        }
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        setCartModalProduct(product);
    };
    const handleOpenCustomerModal = (product) => {
        setSelectedCustomerProduct(product);
        setIsCustomerModalOpen(true);
    };

    const loadFavorites = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('product_id')
                .eq('user_id', user.id);

            if (error) throw error;
            if (data) {
                setLikedProducts(new Set(data.map(f => f.product_id)));
            }
        } catch (err) {
            console.error("Error fetching favorites:", err);
        }
    }, [user]);

    const loadData = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch categories
            const { data: catData, error: catError } = await supabase.from('categories').select('name').order('name');
            if (!catError && catData) {
                setCategories(['All', ...catData.map(c => c.name)]);
            } else {
                setCategories(['All']);
            }

            // Calculate ordered quantities to dynamically adjust stock
            const { data: ordersData } = await supabase.from('orders').select('product_id, quantity, status');
            const boughtByProduct = {};
            if (ordersData) {
                ordersData.forEach(o => {
                    if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
                        boughtByProduct[o.product_id] = (boughtByProduct[o.product_id] || 0) + o.quantity;
                    }
                });
            }

            if (data) {
                const formatted = data.map(item => ({
                    product_id: item.product_id,
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    image: item.image_url,
                    description: item.description || '',
                    launchDate: item.launch_date,
                    stock: Math.max(0, (item.stock !== null ? item.stock : 0) - (boughtByProduct[item.product_id] || 0))
                }));
                setProducts(formatted);
            }
        } catch (err) {
            console.error("Error fetching products from Supabase:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredProducts = useMemo(() => {
        let res = products;
        if (categoryFilter !== 'All') {
            res = res.filter(p => p.category === categoryFilter);
        }
        if (localSearchTerm) {
            const lower = localSearchTerm.toLowerCase();
            res = res.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.product_id && p.product_id.toLowerCase().includes(lower))
            );
        }
        return res;
    }, [products, localSearchTerm, categoryFilter]);

    useEffect(() => {
        loadData();
        if (user) {
            loadFavorites();
        } else {
            setLikedProducts(new Set());
        }
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user, loadData, loadFavorites]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'image/webp' && file.type !== 'image/avif') {
                setImageError('Invalid image format. Only WEBP or AVIF formats are allowed.');
                setFormData({ ...formData, image: '' });
                setImageFile(null);
                return;
            }
            setImageError('');
            setImageFile(file); // Store the actual file for uploading later
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result }); // Keep base64 for quick preview
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setImageFile(null);
            setFormData({
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description || '',
                image: product.image, // If editing, this is the existing URL
                stock: product.stock !== undefined ? product.stock : 100
            });
        } else {
            setEditingProduct(null);
            setImageFile(null);
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

    const uploadImage = async (file) => {
        if (!file) return null;

        // Ensure you have created a bucket named 'products_images' in your Supabase dashboard and made it "Public"
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products_images') // Make sure this matches your bucket name exactly
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('products_images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        let isSuccess = false;

        try {
            // Default to keeping the existing image URL or preview string
            let uploadedImageUrl = formData.image;

            // If the user selected a NEW file, upload it first before saving the DB record
            if (imageFile) {
                try {
                    uploadedImageUrl = await uploadImage(imageFile);
                } catch (err) {
                    console.error("DEBUG UPLOAD ERROR:", err);
                    alert("Failed to upload image to Supabase: " + (err.message || JSON.stringify(err)));
                    return;
                }
            }

            if (editingProduct) {
                // Edit Mode in Supabase
                const { error: dbError } = await supabase
                    .from('products')
                    .update({
                        name: formData.name,
                        price: Number(formData.price),
                        stock: Number(formData.stock),
                        category: formData.category,
                        image_url: uploadedImageUrl,
                        description: formData.description,
                    })
                    .eq('product_id', editingProduct.product_id);

                if (dbError) {
                    console.error("Error updating product in Supabase:", dbError);
                    alert("Failed to update product in database: " + dbError.message);
                    return;
                }
                isSuccess = true;
            } else {
                // Add Mode
                const newId = "P" + Date.now().toString().slice(-6);
                const newLaunchDate = new Date().toISOString().split('T')[0];

                // Insert into Supabase
                const { error: dbError } = await supabase
                    .from('products')
                    .insert([{
                        product_id: newId,
                        name: formData.name,
                        price: Number(formData.price),
                        stock: Number(formData.stock) || 0,
                        category: formData.category,
                        image_url: uploadedImageUrl,
                        description: formData.description,
                        launch_date: newLaunchDate
                    }]);

                if (dbError) {
                    console.error("Error adding product to Supabase:", dbError);
                    alert("Failed to add product to database: " + dbError.message);
                    return;
                }
                isSuccess = true;
            }

            if (isSuccess) {
                setIsModalOpen(false);
                loadData();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Only Admin can see this page content in full mode? 
    // User requested "to admin user also show thsis page", implying customers might see it too?
    // "Add a page... to admin user also show thsis page" -> Usually means Admin-only features.
    // But later "Place order page show all products".
    // I'll assume this page is visible to everyone as a 'Catalog', but only Admin can Add/Edit.



    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* Filters */}
            <div className="glass-panel p-3 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        className="w-full glass-input pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="glass-input cursor-pointer min-w-[200px]"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Grid / List */}
            {user?.role === 'admin' ? (
                loading ? (
                    <SkeletonLoader type="table" count={5} />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest">Price</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Stock</th>
                                        <th className="px-6 py-3.5 text-sm font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map(product => (
                                        <tr
                                            key={product.product_id}
                                            className="hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer group"
                                            onClick={() => navigate(`/purchase-history/${product.product_id}`)}
                                        >
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg shadow-sm overflow-hidden shrink-0 border border-slate-200 bg-white">
                                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" onError={(e) => { e.target.src = 'https://placehold.co/400?text=NA' }} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm md:text-base line-clamp-1 group-hover:text-red-600 transition-colors" title={product.name}>{product.name}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{product.product_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg uppercase tracking-wider border border-indigo-100 whitespace-nowrap shadow-sm">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="font-black text-slate-800 text-base">₹{product.price?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-sm border ${product.stock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                                                    {product.stock}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm rounded-lg transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    No products found.
                                </div>
                            )}
                        </div>
                    </div>
                )
            ) : loading ? (
                <SkeletonLoader type="card" count={8} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No products found.
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div
                                key={product.product_id}
                                className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1"
                                onClick={() => handleOpenCustomerModal(product)}
                            >
                                <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                                        {product.category}
                                    </div>
                                    {product.stock <= 10 && (
                                        <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-lg z-10 shadow-red-500/30 animate-pulse pointer-events-none">
                                            Out of Stock
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => toggleLike(e, product.product_id)}
                                        className="absolute top-3 right-3 p-2 bg-white/40 hover:bg-white/90 backdrop-blur-sm rounded-full text-slate-500 hover:text-red-500 shadow-sm transition-all z-20"
                                    >
                                        <Heart size={18} className={likedProducts.has(product.product_id) ? 'fill-red-500 text-red-500' : ''} />
                                    </button>
                                </div>
                                <div className="p-5 flex-1 flex flex-col pt-4">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{product.name}</h3>
                                    <div className="mb-2"></div>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed" title={product.description}>
                                        {product.description || 'No additional details available.'}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between pt-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => product.stock > 10 && handleAddToCart(e, product)}
                                                disabled={product.stock <= 10}
                                                className={`px-5 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all ${
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
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Manage Modal */}
            {
                isModalOpen && (
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
                                        onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
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
                                        {categories.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Product Image</label>
                                    <div className={`border-2 border-dashed ${imageError ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:bg-slate-50'} rounded-xl p-4 text-center transition-colors relative`}>
                                        <input
                                            type="file"
                                            accept="image/webp, image/avif"
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
                                                <Upload size={32} className={`mb-2 ${imageError ? 'text-red-500' : ''}`} />
                                                <p className={`text-sm ${imageError ? 'text-red-600 font-medium' : ''}`}>
                                                    {imageError || 'Click to upload or drag and drop (WEBP or AVIF only)'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Description</label>
                                    <textarea
                                        className="glass-input w-full h-24 resize-none"
                                        maxLength={300}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                    <div className="text-right text-xs text-slate-500 mt-1">
                                        {(formData.description || '').length}/300
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-2 flex items-center justify-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {editingProduct ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> {editingProduct ? 'Update Product' : 'Add Product'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Customer Product Details Modal */}
            {
                isCustomerModalOpen && selectedCustomerProduct && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsCustomerModalOpen(false)}>
                        <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-100" onClick={(e) => e.stopPropagation()}>
                            <div className="relative h-72 bg-gradient-to-b from-slate-50 to-slate-200 flex items-center justify-center overflow-hidden">
                                <img
                                    src={selectedCustomerProduct.image}
                                    alt={selectedCustomerProduct.name}
                                    className="w-full h-full object-cover mix-blend-multiply"
                                    onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                />
                                <button
                                    onClick={() => setIsCustomerModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                    {selectedCustomerProduct.category}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight pr-4">{selectedCustomerProduct.name}</h2>
                                    <div className="text-2xl font-black text-red-600 shrink-0">
                                        ₹{selectedCustomerProduct.price?.toLocaleString()}
                                    </div>
                                </div>

                                <div className="mb-6 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                    {selectedCustomerProduct.stock <= 10 && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-bold flex items-center gap-2">
                                            <AlertCircle size={18} />
                                            Currently out of stock. Please check back later!
                                        </div>
                                    )}
                                    <h4 className="text-[15px] font-bold text-slate-900 mb-2">Description</h4>
                                    <p className="text-slate-600 text-[14px] leading-relaxed whitespace-pre-wrap">
                                        {selectedCustomerProduct.description || "No description provided."}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        if (selectedCustomerProduct.stock > 10) {
                                            handleAddToCart(e, selectedCustomerProduct);
                                            setIsCustomerModalOpen(false);
                                        }
                                    }}
                                    disabled={selectedCustomerProduct.stock <= 10}
                                    className={`w-full py-3.5 font-bold text-[17px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        selectedCustomerProduct.stock <= 10
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-100 text-indigo-700 shadow-indigo-500/20 hover:bg-indigo-200 hover:scale-[1.02]'
                                    }`}
                                >
                                    {selectedCustomerProduct.stock <= 10 ? (
                                        <>Out of Stock</>
                                    ) : (
                                        <><ShoppingCart size={20} /> Add to Cart</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* AddToCartModal */}
            <AddToCartModal
                product={cartModalProduct}
                onClose={() => setCartModalProduct(null)}
                onAdded={() => navigate('/place-order', { state: { openCartTab: true } })}
            />
        </div >
    );
};

export default AllProducts;
