import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';

const ReviewCard = ({ review }) => {
    const { 
        user_name, 
        user_avatar, 
        rating, 
        date, 
        comment, 
        is_verified = true, 
        images = [], 
        helpful_count = 0 
    } = review;

    const [helpful, setHelpful] = useState(helpful_count);
    const [voted, setVoted] = useState(null);

    const handleVote = (type) => {
        if (voted === type) {
            setVoted(null);
            setHelpful(h => type === 'up' ? h - 1 : h);
        } else {
            setVoted(type);
            setHelpful(h => type === 'up' ? h + 1 : (voted === 'up' ? h - 1 : h));
        }
    };

    return (
        <div className="bg-white/40 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img 
                            src={user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user_name}`} 
                            alt={user_name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">{user_name}</h4>
                            {is_verified && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} />
                                    <span>Verified</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                            {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <StarRating rating={rating} size="sm" />
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {comment}
            </p>

            {images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 shrink-0 shadow-sm cursor-zoom-in hover:scale-105 transition-transform">
                            <img src={img} alt="review" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-white/50">
                <button 
                    onClick={() => handleVote('up')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        voted === 'up' ? 'bg-blue-600 text-white' : 'bg-white/50 text-slate-500 hover:bg-white focus:ring-2 focus:ring-blue-100'
                    }`}
                >
                    <ThumbsUp size={14} className={voted === 'up' ? 'fill-white' : ''} />
                    <span>Helpful {helpful > 0 && `(${helpful})`}</span>
                </button>
                <button 
                    onClick={() => handleVote('down')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        voted === 'down' ? 'bg-slate-800 text-white' : 'bg-white/50 text-slate-500 hover:bg-white focus:ring-2 focus:ring-slate-100'
                    }`}
                >
                    <ThumbsDown size={14} className={voted === 'down' ? 'fill-white' : ''} />
                </button>
            </div>
        </div>
    );
};

export default ReviewCard;
