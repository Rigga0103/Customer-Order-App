import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const StarRating = ({ rating, setRating, interactive = false, size = "md" }) => {
    const [hover, setHover] = useState(0);

    const sizes = {
        sm: 16,
        md: 24,
        lg: 32
    };

    const iconSize = sizes[size] || 24;

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    type="button"
                    whileHover={interactive ? { scale: 1.2 } : {}}
                    whileTap={interactive ? { scale: 0.9 } : {}}
                    onClick={() => interactive && setRating(star)}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    disabled={!interactive}
                    className={`${interactive ? 'cursor-pointer' : 'cursor-default focus:outline-none'}`}
                >
                    <Star
                        size={iconSize}
                        className={`transition-all duration-200 ${
                            star <= (hover || rating)
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-300 fill-transparent'
                        }`}
                    />
                </motion.button>
            ))}
        </div>
    );
};

export default StarRating;
