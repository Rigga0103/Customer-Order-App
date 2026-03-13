import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, CheckCircle, Truck, Package, XCircle, 
    ArrowLeft, MapPin, Navigation, Phone, ShieldCheck,
    MessageCircle, MoreHorizontal, Bike
} from 'lucide-react';

// Internal Mock Helper for Step Icon
const PackageCheck = ({ size, className }) => (
    <div className={className}>
        <Package size={size} />
    </div>
);

const OrderTracker = ({ order, onBack }) => {
    if (!order) return null;

    const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
    
    const steps = [
        { label: 'Pending', status: 'PENDING', icon: Clock },
        { label: 'Approved', status: 'APPROVED', icon: ShieldCheck },
        { label: 'Dispatch', status: 'DISPATCHED', icon: Truck },
        { label: 'Delivered', status: 'DELIVERED', icon: PackageCheck }
    ];

    // Map internal statuses to steps
    const getStatusIndex = (status) => {
        if (status === 'PENDING') return 0;
        if (status === 'APPROVED') return 1;
        if (status === 'DISPATCHED') return 2;
        if (status === 'DELIVERED') return 3;
        return -1;
    };

    const currentStepIndex = getStatusIndex(order.status);

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#F0F5FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8"
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-blue-50 gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onBack}
                            className="p-3 hover:bg-blue-50 rounded-2xl transition-colors text-blue-600 border border-blue-100 shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                <img src={order.product_image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Order Tracking</p>
                                <h2 className="text-lg font-black text-slate-800 leading-none">#{order.order_id}</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1 truncate max-w-[150px]">{order.product_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-8 px-2 sm:px-0">
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                            <p className="font-bold text-slate-700">{order.quantity} Units</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival</p>
                            <p className="font-bold text-slate-700">~ 30 Mins</p>
                        </div>
                    </div>
                </div>

                {/* Status Header Bar */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50 overflow-hidden relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-1">
                                {isCancelled ? 'Order Cancelled' : 'In Transit'}
                            </h3>
                            <p className="text-slate-500 font-medium">
                                {isCancelled 
                                    ? 'This order was cancelled and will not be delivered.' 
                                    : `Arriving in 25 - 30 mins to ${order.address?.split(',')[0] || 'your location'}`
                                }
                            </p>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider border shadow-sm ${
                            isCancelled 
                                ? 'bg-red-50 text-red-600 border-red-100' 
                                : 'bg-blue-600 text-white border-blue-700 shadow-blue-200'
                        }`}>
                            {order.status}
                        </div>
                    </div>

                    {!isCancelled && (
                        <div className="mt-12 relative">
                            {/* Desktop Timeline Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentStepIndex / 3) * 100}%` }}
                                    className="h-full bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-0">
                                {steps.map((step, idx) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = idx < currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    const isUpcoming = idx > currentStepIndex;

                                    return (
                                        <div key={step.label} className="flex md:flex-col items-center gap-4 md:gap-0 relative z-10 w-full md:w-auto">
                                            {/* Step Circle */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-md md:mb-3 ${
                                                isCompleted 
                                                    ? 'bg-green-500 border-green-500 text-white shadow-green-100' 
                                                    : isCurrent 
                                                        ? 'bg-white border-orange-400 text-orange-500 shadow-orange-100 scale-125' 
                                                        : 'bg-white border-slate-100 text-slate-300'
                                            }`}>
                                                {isCompleted ? <CheckCircle size={22} /> : <StepIcon size={22} />}
                                            </div>
                                            
                                            {/* Step Label */}
                                            <div className="flex flex-col md:items-center">
                                                <span className={`text-sm font-black ${
                                                    isCompleted ? 'text-green-600' : isCurrent ? 'text-slate-800' : 'text-slate-400'
                                                }`}>
                                                    {step.label}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
                                                    {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                                                </span>
                                            </div>

                                            {/* Mobile Connecting Line */}
                                            {idx < 3 && (
                                                <div className="absolute left-[22px] top-12 w-0.5 h-8 bg-slate-100 md:hidden">
                                                    {isCompleted && <div className="w-full h-full bg-green-500 rounded-full" />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {!isCancelled && order.status === 'DISPATCHED' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-blue-600 p-4 rounded-3xl flex items-center gap-4 text-white shadow-lg shadow-blue-200"
                        >
                            <div className="bg-white/20 p-3 rounded-2xl">
                                <Truck size={24} className="animate-bounce" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg leading-none mb-1">Your order is on the way</h4>
                                <p className="text-blue-100 text-sm font-medium">Out for delivery from Mumbai Warehouse</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map & Agent Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Map */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-blue-50 overflow-hidden relative group h-[400px]">
                            {isCancelled ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 space-y-4 p-8 text-center">
                                    <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center animate-pulse">
                                        <XCircle size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800">Order Cancelled</h3>
                                    <p className="text-slate-500 max-w-xs font-medium">Sorry, the live tracking is not available for cancelled orders. Please contact support if you have questions.</p>
                                    <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200">Contact Support</button>
                                </div>
                            ) : (
                                <>
                                    {/* Simulated Map Background */}
                                    <div className="absolute inset-4 rounded-[2rem] bg-[#E5F1FF] overflow-hidden">
                                        {/* Mock Map Grid/Roads */}
                                        <div className="absolute inset-0 opacity-20 pointer-events-none" 
                                             style={{backgroundImage: 'radial-gradient(#2563eb 1px, transparent 0)', backgroundSize: '40px 40px'}} />
                                        <svg className="absolute inset-0 w-full h-full p-10 opacity-40">
                                            <path d="M50,150 Q150,50 250,150 T450,150" fill="none" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" />
                                            <path d="M100,50 L100,250 M300,50 L300,250" fill="none" stroke="#2563eb" strokeWidth="8" strokeOpacity="0.5" />
                                        </svg>

                                        {/* Warehouse Pin */}
                                        <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                                            <div className="bg-slate-800 text-white p-3 rounded-2xl shadow-lg">
                                                <Navigation size={20} />
                                            </div>
                                            <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-sm">Warehouse</span>
                                        </div>

                                        {/* Animated Path */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            <motion.path 
                                                d="M70,200 L150,200 L150,100 L300,100 L300,250 L450,250" 
                                                fill="none" 
                                                stroke="#fb923c" 
                                                strokeWidth="4" 
                                                strokeDasharray="8 8" 
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            />
                                        </svg>

                                        {/* Moving Scooter Icon */}
                                        <motion.div 
                                            className="absolute"
                                            animate={{ 
                                                x: [70, 150, 150, 300, 300, 450], 
                                                y: [200, 200, 100, 100, 250, 250] 
                                            }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            style={{ margin: '-20px' }}
                                        >
                                            <div className="bg-orange-500 p-2.5 rounded-full text-white shadow-xl shadow-orange-300 ring-4 ring-white">
                                                <Bike size={20} strokeWidth={3} />
                                            </div>
                                        </motion.div>

                                        {/* Customer Location Pin */}
                                        <div className="absolute right-10 bottom-1/3 flex flex-col items-center gap-2">
                                            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg animate-bounce">
                                                <MapPin size={20} />
                                            </div>
                                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm">Home</span>
                                        </div>
                                    </div>

                                    {/* Floating Live Indicator */}
                                    <div className="absolute top-8 left-8 bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-blue-50">
                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Live Tracking</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Agent Card & Actions */}
                    <div className="space-y-6">
                        {/* Agent Card */}




                        {/* Help Button */}
                        <button className="w-full py-4 bg-white border-2 border-slate-100 rounded-3xl text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <MoreHorizontal size={20} />
                            <span>Need help with order?</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


export default OrderTracker;
