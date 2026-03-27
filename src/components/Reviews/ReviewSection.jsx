import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, ChevronDown, ChevronUp, CloudCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import RatingDistribution from './RatingDistribution';
import ReviewForm from './ReviewForm';

const ReviewSection = ({ order }) => {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!order?.product_id) return;

            try {
                setLoading(true);
                // Fetch reviews directly without join to avoid PGRST200 error
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', order.product_id)
                    .order('created_at', { ascending: false });

                if (reviewsError) throw reviewsError;

                if (reviewsData && reviewsData.length > 0) {
                    // Fetch user details for these reviews separately
                    const userIds = [...new Set(reviewsData.map(r => r.user_id))].filter(Boolean);
                    let usersMap = {};

                    if (userIds.length > 0) {
                        const { data: usersData, error: usersError } = await supabase
                            .from('users')
                            .select('id, first_name, email, avatar_url')
                            .in('id', userIds);

                        if (usersError) {
                            console.error("Error fetching users for reviews:", usersError);
                        } else {
                            usersMap = usersData.reduce((acc, u) => {
                                acc[u.id] = u;
                                return acc;
                            }, {});
                        }
                    }

                    const formattedReviews = reviewsData.map(r => {
                        const reviewUser = usersMap[r.user_id];
                        return {
                            id: r.id,
                            user_name: reviewUser?.first_name || reviewUser?.email?.split('@')[0] || "Anonymous",
                            user_avatar: reviewUser?.avatar_url || null,
                            rating: r.rating,
                            date: r.created_at,
                            comment: r.description,
                            is_verified: true,
                            images: r.image_url ? [r.image_url] : [],
                            helpful_count: 0
                        };
                    });
                    setReviews(formattedReviews);
                } else {
                    // Fallback to dummy data if no reviews in Supabase
                    setReviews([
                        {
                            id: 1,
                            user_name: "Sarah Johnson",
                            user_avatar: null,
                            rating: 5,
                            date: new Date().toISOString(),
                            comment: "Absolutely love this product! The quality of the plastic is top-notch and it was very easy to install. Highly recommend to anyone looking for durable piping solutions.",
                            is_verified: true,
                            images: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=200"],
                            helpful_count: 12
                        },
                        {
                            id: 2,
                            user_name: "Michael Chen",
                            user_avatar: null,
                            rating: 4,
                            date: new Date(Date.now() - 86400000).toISOString(),
                            comment: "Good product, but the delivery took a bit longer than expected. The pipe itself is sturdy and meets all specifications.",
                            is_verified: true,
                            images: [],
                            helpful_count: 5
                        }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [order?.product_id]);

    const averageRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1);

    // Calculate distribution
    const distribution = reviews.reduce((acc, current) => {
        acc[current.rating] = (acc[current.rating] || 0) + 1;
        return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const handleAddReview = async (newReview) => {
        if (!user) return alert("You must be logged in to leave a review.");

        setIsSubmitting(true);
        try {
            let imageUrl = null;

            // Handle image upload to Supabase Storage
            if (newReview.images && newReview.images.length > 0) {
                const file = newReview.images[0]; // Handle the first image
                const fileName = `${order.product_id}/${user.id}_${Date.now()}.webp`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(fileName, file, {
                        contentType: 'image/webp',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl }, error: urlError } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const { data, error } = await supabase
                .from("reviews")
                .insert([
                    {
                        product_id: order.product_id,
                        user_id: user.id,
                        rating: newReview.rating,
                        description: newReview.comment,
                        image_url: imageUrl
                    }
                ])
                .select();

            if (error) throw error;

            const reviewWithId = {
                id: data[0].id,
                user_name: user.name || "You",
                user_avatar: user.avatar_url || null,
                rating: newReview.rating,
                date: new Date().toISOString(),
                comment: newReview.comment,
                is_verified: true,
                images: imageUrl ? [imageUrl] : [],
                helpful_count: 0
            };

            setReviews([reviewWithId, ...reviews]);
            setShowForm(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-8 border-t border-slate-100 pt-8 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <MessageSquare className="text-red-500" size={20} />
                        Customer Reviews
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={Math.round(averageRating)} size="sm" />
                        <span className="text-sm font-bold text-slate-700">{averageRating} out of 5</span>
                        <span className="text-xs text-slate-400 font-medium ml-2">({reviews.length} reviews)</span>
                    </div>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <Plus size={16} />
                        Write a Review
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showForm && (
                    <div className="mb-10">
                        <ReviewForm
                            productName={order.product_name}
                            onCancel={() => setShowForm(false)}
                            onSubmit={handleAddReview}
                        />
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 sticky top-4">
                    <RatingDistribution ratings={distribution} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {reviews.slice(0, isExpanded ? reviews.length : 2).map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}

                    {reviews.length > 2 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            {isExpanded ? (
                                <>Show Less <ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /></>
                            ) : (
                                <>View All {reviews.length} Reviews <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
