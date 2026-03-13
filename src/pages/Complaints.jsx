import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, AlertCircle, CheckCircle, Clock, Check, RefreshCw, Image as ImageIcon, Loader2, Calendar, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';

const Complaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedComplaint, setExpandedComplaint] = useState(null);

    // Form
    const [description, setDescription] = useState('');
    const [productId, setProductId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch products for the dropdown (only needed columns)
            const { data: pData } = await supabase.from('products').select('product_id, name').order('name');
            if (pData) setProducts(pData);

            // Fetch complaints
            let query = supabase.from('complaints').select(`
                *,
                products!product_id(name, image_url, category)
            `).order('created_at', { ascending: false });
            
            if (user.role !== 'admin') {
                query = query.eq('customer_id', user.id);
            }
            const { data: cData, error } = await query;
            if (!error && cData) {
                const formatted = cData.map(c => ({
                    ...c,
                    history: Array.isArray(c.history) ? c.history : [],
                    product_name: c.products?.name || 'Product Not Found',
                    product_image: c.products?.image_url || 'https://placehold.co/400?text=Product',
                    product_category: c.products?.category || 'General'
                }));
                setComplaints(formatted);
            }
        } catch (err) {
            console.error("Error fetching complaints:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Image must be less than 5MB");
                return;
            }
            setImageFile(file);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('complaints_images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('complaints_images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId || !description) return;
        setIsSubmitting(true);

        let uploadedImageUrl = null;
        try {
            if (imageFile) {
                uploadedImageUrl = await uploadImage(imageFile);
            }

            const newComplaint = {
                complaint_id: "C" + Date.now().toString().slice(-6),
                customer_id: user.id,
                product_id: productId,
                description: description,
                images: uploadedImageUrl ? [uploadedImageUrl] : [],
                status: "PENDING",
                created_at: new Date().toISOString(),
                history: [{ status: "PENDING", at: new Date().toISOString(), by: user.id }]
            };

            const { error } = await supabase.from('complaints').insert([newComplaint]);

            if (error) {
                alert('Failed to submit complaint. Please try again.');
                console.error(error);
            } else {
                setDescription('');
                setProductId('');
                setImageFile(null);
                setShowForm(false);
                loadData();
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const complaint = complaints.find(c => c.complaint_id === id);
        if (!complaint) return;

        const newHistory = [...complaint.history, { status: newStatus, at: new Date().toISOString(), by: user.id }];

        const { error } = await supabase
            .from('complaints')
            .update({
                status: newStatus,
                history: newHistory
            })
            .eq('complaint_id', id);

        if (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status.");
        } else {
            loadData();
        }
    };

    const toggleExpand = (id) => {
        setExpandedComplaint(expandedComplaint === id ? null : id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'IN-PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-amber-50 text-amber-600 border-amber-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                {user?.role !== 'admin' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all font-medium"
                    >
                        {showForm ? 'Cancel' : 'New Complaint'}
                    </button>
                )}
            </div>

            {showForm && user?.role !== 'admin' && (
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Attach Image (Optional)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-red-400 transition-colors bg-white/50">
                                <div className="space-y-2 text-center">
                                    {imageFile ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 mb-2">
                                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium">{imageFile.name}</p>
                                            <button type="button" onClick={() => setImageFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-1">Remove</button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                                            <div className="flex text-sm text-slate-600 justify-center">
                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
                            >
                                <Send size={18} />
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-5">
                {loading ? (
                    <SkeletonLoader type="list" count={5} />
                ) : complaints.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium tracking-tight">No complaints found.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {complaints.map(complaint => {
                            const isExpanded = expandedComplaint === complaint.complaint_id;
                            return (
                                <div
                                    key={complaint.complaint_id}
                                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden group transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 border-slate-200`}
                                >
                                    <div 
                                        className="p-5 md:flex gap-6 items-start cursor-pointer transition-colors hover:bg-slate-50/50"
                                        onClick={() => {
                                            if (user?.role === 'admin') {
                                                navigate(`/complaints/${complaint.complaint_id}`);
                                            } else {
                                                toggleExpand(complaint.complaint_id);
                                            }
                                        }}
                                    >
                                        {/* Left: Product Image */}
                                        <div className="relative shrink-0 mb-4 md:mb-0">
                                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group-hover:shadow-md transition-all duration-300">
                                                <img 
                                                    src={complaint.product_image} 
                                                    alt={complaint.product_name} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                                                    onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                                />
                                            </div>
                                            <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg shadow-black/20 z-10">
                                                {complaint.product_category}
                                            </div>
                                        </div>

                                        {/* Center: Details */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(complaint.status)} animate-fade-in`}>
                                                        {complaint.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono tracking-tighter bg-slate-50 px-2 py-0.5 rounded">
                                                        #{complaint.complaint_id}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                                                    {complaint.product_name}
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-1">{complaint.description}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                                                    <p className="text-slate-500">PID: <span className="text-slate-900 font-bold">{complaint.product_id}</span></p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={13} />
                                                    <span className="text-xs font-semibold">{new Date(complaint.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Title</p>
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">Complaint Ticket</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Support</p>
                                                        <p className="text-xs font-bold text-slate-700">Rigga Ind.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Toggle/Action Icon */}
                                        <div className="shrink-0 self-center hidden md:block">
                                            {user?.role === 'admin' ? (
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-widest border border-red-100 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">Details</span>
                                            ) : (
                                                <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details (History & Description) */}
                                    {isExpanded && user?.role !== 'admin' && (
                                        <div className="p-6 border-t border-slate-100 bg-white animate-fade-in">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Timeline */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Clock size={16} className="text-red-500" />
                                                        <h4 className="font-semibold text-slate-800 text-sm">Complaint Timeline</h4>
                                                    </div>
                                                    <div className="relative pl-3 border-l-2 border-slate-100 ml-2 space-y-6">
                                                        {complaint.history.map((h, idx) => (
                                                            <div key={idx} className="relative pl-6">
                                                                <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-slate-200 shadow-sm z-10">
                                                                    {h.status === 'PENDING' ? <Clock size={16} className="text-amber-500" /> : <Check size={16} className="text-emerald-500" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-700">{h.status}</span>
                                                                    <span className="text-xs text-slate-500">{new Date(h.at).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Details Info */}
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <h4 className="font-semibold text-slate-800 text-sm mb-2">Complaint Description</h4>
                                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.description}</p>
                                                    </div>
                                                    {complaint.images && complaint.images.length > 0 && (
                                                        <div className="pt-2">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attachment</p>
                                                            <div className="flex gap-2">
                                                                {complaint.images.map((img, i) => (
                                                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                                                                        <img src={img} alt="Attachment" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complaints;

