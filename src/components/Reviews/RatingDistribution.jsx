import React from 'react';

const RatingDistribution = ({ ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }) => {
    const total = Object.values(ratings).reduce((a, b) => a + b, 0) || 1;
    
    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-sm space-y-3">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((star) => {
                const count = ratings[star] || 0;
                const percentage = Math.round((count / total) * 100);
                
                return (
                    <div key={star} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 w-4">{star}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                    star === 5 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                    star === 4 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' :
                                    star === 3 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' :
                                    star === 2 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                                    'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 w-8 text-right">{percentage}%</span>
                    </div>
                );
            })}
        </div>
    );
};

export default RatingDistribution;
