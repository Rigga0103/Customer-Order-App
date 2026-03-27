import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ShoppingBag, Star, Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const NewProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category: 'Electrical',
        image: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('launch_date', { ascending: false })
                .limit(20);

            if (error) throw error;

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

            // Fetch categories
            const { data: catData, error: catError } = await supabase.from('categories').select('name').order('name');
            if (catData && !catError) {
                setCategories(catData.map(c => c.name));
            } else {
                setCategories(['Electrical', 'Hardware', 'Lighting', 'Tools', 'Accessories']);
            }
        } catch (err) {
            console.error('Error fetching new products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
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

    const uploadImage = async (file) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products_images')
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
        if (!formData.name || !formData.price || isSubmitting) return;

        setIsSubmitting(true);
        let isSuccess = false;

        try {
            let uploadedImageUrl = formData.image || 'https://placehold.co/400?text=' + encodeURIComponent(formData.name);

            if (imageFile) {
                try {
                    uploadedImageUrl = await uploadImage(imageFile);
                } catch (err) {
                    console.error("DEBUG UPLOAD ERROR:", err);
                    alert("Failed to upload image to Supabase: " + (err.message || JSON.stringify(err)));
                    return;
                }
            }

            // Capitalize category and check if it exists in Supabase
            const finalCategory = formData.category.trim() ? formData.category.trim().charAt(0).toUpperCase() + formData.category.trim().slice(1) : 'Uncategorized';
            if (finalCategory && finalCategory !== 'Uncategorized' && !categories.find(c => c.toLowerCase() === finalCategory.toLowerCase())) {
                const { error: catInsertError } = await supabase
                    .from('categories')
                    .insert([{ name: finalCategory, description: `Auto-created category: ${finalCategory}` }]);
                if (!catInsertError) {
                    setCategories(prev => [...prev, finalCategory].sort());
                }
            }

            const newId = "P" + Date.now().toString().slice(-6);
            const newLaunchDate = new Date().toISOString().split('T')[0];

            const { error: dbError } = await supabase
                .from('products')
                .insert([{
                    product_id: newId,
                    name: formData.name,
                    price: Number(formData.price),
                    stock: Number(formData.stock) || 0,
                    category: finalCategory,
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
            if (isSuccess) {
                window.dispatchEvent(new Event('ri_data_changed'));
                loadProducts();
                setIsModalOpen(false);
                setFormData({ name: '', price: '', stock: '', category: 'Electrical', image: '', description: '' });
                setImageFile(null);
            }
        } finally {
            setIsSubmitting(false);
        }
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {loading ? (
                    <SkeletonLoader type="card" count={4} className="col-span-full" />
                ) : products.map(p => (
                    <div
                        key={p.product_id}
                        className={`glass-card group overflow-hidden flex flex-col cursor-pointer transition-all ${user?.role === 'admin' ? 'hover:ring-2 hover:ring-red-500' : 'hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1'}`}
                        onClick={() => {
                            if (user?.role === 'admin') navigate(`/purchase-history/${p.product_id}`);
                            else handleOrder(p.product_id);
                        }}
                    >
                        <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                            <img
                                src={p.image}
                                alt={p.name}
                                className={"w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"}
                                onError={(e) => { e.target.src = 'https://placehold.co/400?text=New+Launch' }}
                            />
                            <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-md z-10">
                                NEW
                            </span>
                            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm">
                                {p.category}
                            </div>
                            {p.stock <= 10 && (
                                <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-lg z-10 shadow-red-500/30 animate-pulse pointer-events-none">
                                    Out of Stock
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col pt-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{p.name}</h3>
                            {user?.role === 'admin' ? (
                                <p className="text-xs text-slate-400 mb-4 font-mono">ID: {p.product_id}</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 border border-slate-300 rounded text-slate-600 uppercase tracking-widest">{p.category}</span>
                                </div>
                            )}

                            {user?.role !== 'admin' && (
                                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed" title={p.description}>
                                    {p.description || 'No additional details available.'}
                                </p>
                            )}

                            <div className="mt-auto flex items-end justify-between pt-1">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                    <span className="text-xl font-black text-slate-900 tracking-tight">₹{p.price?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user?.role === 'admin' ? (
                                        <div className="text-xs font-semibold px-2 py-1 bg-slate-100/80 border border-slate-200 rounded-md text-slate-600 mb-1">
                                            Stock: {p.stock}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (p.stock > 10) handleOrder(p.product_id); 
                                            }}
                                            disabled={p.stock <= 10}
                                            className={`px-5 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all flex items-center justify-center whitespace-nowrap ${
                                                p.stock <= 10
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-indigo-900/5 hover:-translate-y-0.5'
                                            }`}
                                        >
                                            {p.stock <= 10 ? 'Out of Stock' : 'Order'}
                                        </button>
                                    )}
                                </div>
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
                                        placeholder="E.G. HEAVY DUTY DRILL"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="w-1/4">
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        placeholder="2500"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="w-1/4">
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Qty</label>
                                    <input
                                        type="number"
                                        className="glass-input w-full"
                                        placeholder="100"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Category</label>
                                <input
                                    type="text"
                                    list="categories-datalist"
                                    className="glass-input w-full"
                                    placeholder="Select or type new category..."
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                                <datalist id="categories-datalist">
                                    {categories.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
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
                                    className="glass-input w-full resize-none"
                                    rows="3"
                                    maxLength={300}
                                    placeholder="Product features and details..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                        Launching...
                                    </>
                                ) : (
                                    'Launch Product'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default NewProducts;
