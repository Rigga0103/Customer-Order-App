import React, { useState, useEffect } from 'react';
import { LS } from '../utils/LSHelpers';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, IndianRupee, Package, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [targetData, setTargetData] = useState({ target: 0, achieved: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [newProducts, setNewProducts] = useState([]);

    const loadData = () => {
        if (!user) return;

        // Targets
        const targets = LS.get('ri_targets');
        // Find target for this user. Fallback to dummy if missing.
        const t = targets.find(x => x.user_id === user.id) || { target: 50000, achieved: 0 };
        setTargetData(t);

        // Orders
        const allOrders = LS.get('ri_orders');
        const userOrders = user.role === 'admin' ? allOrders : allOrders.filter(o => o.customer_id === user.id);
        setRecentOrders(userOrders.slice(0, 5));

        // Products
        const allProducts = LS.get('ri_products');
        // Sort by launch date desc
        const sortedProds = [...allProducts].sort((a, b) => new Date(b.launchDate) - new Date(a.launchDate));
        setNewProducts(sortedProds.slice(0, 3));
    };

    useEffect(() => {
        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user]);

    const balance = Math.max(0, targetData.target - targetData.achieved);
    const percentage = targetData.target > 0 ? Math.round((targetData.achieved / targetData.target) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Target Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={100} className="text-red-600" />
                    </div>
                    <h3 className="text-slate-500 font-medium mb-1">Monthly Target</h3>
                    <p className="text-3xl font-bold text-slate-800">₹{targetData.target.toLocaleString()}</p>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IndianRupee size={100} className="text-emerald-600" />
                    </div>
                    <h3 className="text-slate-500 font-medium mb-1">Achieved</h3>
                    <p className="text-3xl font-bold text-emerald-600">₹{targetData.achieved.toLocaleString()}</p>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2 font-medium">{percentage}% Completed</p>
                </div>

                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package size={100} className="text-orange-600" />
                    </div>
                    <h3 className="text-slate-500 font-medium mb-1">Balance to Goal</h3>
                    <p className="text-3xl font-bold text-orange-500">₹{balance.toLocaleString()}</p>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500">Reach your target to unlock silver tier!</p>
                    </div>
                </div>
            </div>

            {/* New Product Launch Section */}
            <div className="glass-panel p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">New Product Launches</h2>
                        <p className="text-slate-500 text-sm">Check out our latest industrial innovations</p>
                    </div>
                    <Link to="/new-products" className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1">
                        View All <ArrowUpRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {newProducts.map((product) => (
                        <div key={product.product_id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="h-48 overflow-hidden relative">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }} />
                                <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">NEW</span>
                            </div>
                            <div className="p-4">
                                <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-red-600 transition-colors truncate">{product.name}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-lg text-slate-900">₹{product.price}</span>
                                    <Link to="/place-order" state={{ preselectedProductId: product.product_id }}>
                                        <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                                            <ShoppingBag size={18} />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Recent Orders</h2>
                    <Link to="/orders" className="text-red-600 hover:text-red-700 font-medium text-sm">View All History</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                <th className="pb-3 font-medium pl-4">Order ID</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Qty</th>
                                <th className="pb-3 font-medium text-right pr-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentOrders.map((order) => (
                                <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-4 font-medium text-slate-900">{order.order_id}</td>
                                    <td className="py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            order.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                order.status === 'APPROVED' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                                    order.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-slate-600">{order.quantity}</td>
                                    <td className="py-4 text-right pr-4 font-semibold text-slate-900">₹{order.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
