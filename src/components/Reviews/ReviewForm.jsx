import React, { useState } from 'react';
import { Camera, Send, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from './StarRating';
import { convertToWebp } from '../../utils/imageConvert';

const ReviewForm = ({ onSubmit, onCancel, productName }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]); // Array of { file: File, preview: string }
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        const newImages = [];
        
        for (const file of files) {
            try {
                const webpFile = await convertToWebp(file, 800);
                newImages.push({
                    file: webpFile,
                    preview: URL.createObjectURL(webpFile)
                });
            } catch (err) {
                console.error("Image conversion failed:", err);
            }
        }
        
        setImages(prev => [...prev, ...newImages].slice(0, 4));
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return alert("Please select a rating.");
        if (comment.length < 5) return alert("Please write a bit more.");
        
        setIsSubmitting(true);
        try {
            // Pass the actual WebP files to onSubmit
            await onSubmit({ 
                rating, 
                comment, 
                images: images.map(img => img.file) 
            });
        } catch (err) {
            console.error("Submission error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-2xl border border-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden text-left"
        >
            <div className="absolute top-0 right-0 p-4">
                <button 
                  type="button"
                  onClick={onCancel} 
                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Write a Review</h3>
                <p className="text-slate-500 text-sm font-medium">Sharing your experience with <span className="text-red-600 font-bold">{productName}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 font-sans">Overall Rating</label>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex justify-center shadow-inner">
                        <StarRating rating={rating} setRating={setRating} interactive={true} size="lg" />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 font-sans">Your Thoughts</label>
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you like or dislike?"
                        className="w-full h-32 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-slate-700 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none placeholder:text-slate-300 shadow-inner"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 font-sans">Add Photos (Optional)</label>
                    <div className="flex flex-wrap gap-3">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group/img">
                                <img src={img.preview} alt="review" className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {images.length < 4 && (
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all text-slate-400 hover:text-red-500">
                                <Camera size={24} />
                                <span className="text-[10px] font-bold mt-1">Upload</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Submit Review</span>
                            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default ReviewForm;
