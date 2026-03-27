import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
    Clock, Truck, Package, PackageCheck, PackageX, ShoppingBag,
    ArrowUpRight, X, TrendingUp, Users, DollarSign,
    ShoppingCart, BarChart3, Award, CheckCircle2,
    AlertCircle, CircleDashed, CircleCheckBig
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart,
    Pie, Cell, LineChart, Line
} from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allRawOrders, setAllRawOrders] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('revenue'); // 'revenue', 'orders', 'customers', 'products'
    const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'pending', 'approved', 'dispatched', 'delivered', 'cancelled'

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            try {
                // Orders
                let orderQuery = supabase.from('orders').select(`
                    *,
                    users!customer_id (first_name, email),
                    products!product_id (name, image_url, category)
                `).order('created_at', { ascending: false });

                if (user.role !== 'admin') {
                    orderQuery = orderQuery.eq('customer_id', user.id);
                }

                const { data: userOrders, error: orderError } = await orderQuery;

                if (orderError) {
                    console.error("Dashboard: Error loading orders:", orderError);
                }

                if (userOrders) {
                    const enriched = userOrders.map(o => ({
                        ...o,
                        customer_name: o.users?.first_name || o.users?.email || 'N/A',
                        product_name: o.products?.name || o.product_name || 'N/A',
                        category: o.products?.category || o.category || 'General'
                    }));
                    setAllRawOrders(enriched);
                }

                // Products (Only fetch if customer, since admin doesn't see this section)
                if (user.role !== 'admin') {
                    const { data: allProducts, error: productError } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(3);
                    if (productError) console.error("Dashboard: Error loading products:", productError);
                    if (allProducts) {
                        setNewProducts(allProducts);
                    }
                }
            } catch (err) {
                console.error("Dashboard: Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        window.addEventListener('ri_data_changed', loadData);
        return () => window.removeEventListener('ri_data_changed', loadData);
    }, [user]);

    // Filter raw orders based on date range
    const filteredRawOrders = React.useMemo(() => {
        if (!allRawOrders) return [];
        return allRawOrders.filter(order => {
            if (!order || !order.created_at) return true; // Show it if date is missing
            const orderDate = new Date(order.created_at);
            if (isNaN(orderDate.getTime())) return true; // Show it if date is invalid

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (orderDate < sDate) return false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (orderDate > eDate) return false;
            }
            return true;
        });
    }, [allRawOrders, startDate, endDate]);

    // Calculate sales data for charts
    const salesData = React.useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });

            const dayOrders = filteredRawOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.toDateString() === date.toDateString();
            });

            last7Days.push({
                name: dateStr,
                sales: dayOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
                orders: dayOrders.length,
                date: date.toISOString().split('T')[0]
            });
        }
        return last7Days;
    }, [filteredRawOrders]);

    // Calculate best selling products
    const bestSellingProducts = React.useMemo(() => {
        const productSales = filteredRawOrders.reduce((acc, order) => {
            const productName = order.product_name || "Product";
            if (!acc[productName]) {
                acc[productName] = {
                    name: productName,
                    quantity: 0,
                    revenue: 0,
                    orders: 0
                };
            }
            acc[productName].quantity += Number(order.quantity || 0);
            acc[productName].revenue += Number(order.amount || 0);
            acc[productName].orders += 1;
            return acc;
        }, {});

        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [filteredRawOrders]);

    // Calculate category distribution
    const categoryData = React.useMemo(() => {
        const categorySales = filteredRawOrders.reduce((acc, order) => {
            const category = order.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = {
                    name: category,
                    value: 0,
                    revenue: 0
                };
            }
            acc[category].value += Number(order.quantity || 0);
            acc[category].revenue += Number(order.amount || 0);
            return acc;
        }, {});

        return Object.values(categorySales).slice(0, 5);
    }, [filteredRawOrders]);

    // Colors for pie chart
    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

    // Calculate metrics
    const metrics = React.useMemo(() => {
        const totalRevenue = filteredRawOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        const totalOrders = filteredRawOrders.length;
        const uniqueCustomers = new Set(filteredRawOrders.map(o => o.customer_id)).size;
        const totalProducts = filteredRawOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);

        return { totalRevenue, totalOrders, uniqueCustomers, totalProducts };
    }, [filteredRawOrders]);

    // Calculate order status counts
    const orderStatusCounts = React.useMemo(() => {
        const counts = {
            all: filteredRawOrders.length,
            pending: 0,
            approved: 0,
            dispatched: 0,
            delivered: 0,
            cancelled: 0
        };

        filteredRawOrders.forEach(order => {
            if (order.status === 'PENDING') counts.pending++;
            else if (order.status === 'APPROVED') counts.approved++;
            else if (order.status === 'DISPATCHED') counts.dispatched++;
            else if (order.status === 'DELIVERED') counts.delivered++;
            else if (order.status === 'CANCELLED') counts.cancelled++;
        });

        return counts;
    }, [filteredRawOrders]);

    // Filter orders based on selected filter
    // Filter orders based on selected filter
    const filteredOrders = React.useMemo(() => {
        if (orderFilter === 'recent') {
            return filteredRawOrders.slice(0, 5);
        }
        if (orderFilter === 'all') {
            return filteredRawOrders;
        }

        const status = orderFilter.toUpperCase();
        return filteredRawOrders
            .filter(order => order.status === status);
    }, [filteredRawOrders, orderFilter]);

    // Get status icon and color
    const getStatusConfig = (status) => {
        switch (status) {
            case 'PENDING':
                return { icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
            case 'APPROVED':
                return { icon: CircleDashed, bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' };
            case 'DISPATCHED':
                return { icon: Truck, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
            case 'DELIVERED':
                return { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
            case 'CANCELLED':
                return { icon: PackageX, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' };
            default:
                return { icon: Clock, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
        }
    };

    // Optimize Dashboard rendering by memoizing metrics calculations securely on the client
    // (Consolidated into filteredRawOrders and metrics memo)

    // Tab content for KPI cards
    const renderKPIContent = () => {
        switch (activeTab) {
            case 'revenue':
                return (
                    <>
                        <div className="glass-card p-6 border-b-4 border-emerald-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('revenue')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Revenue</h3>
                                <DollarSign size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">
                                ₹{metrics.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">+12.5% from last month</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('orders')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Orders</h3>
                                <ShoppingCart size={20} className="text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {metrics.totalOrders}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">+8.2% from last month</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('customers')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">New Customers</h3>
                                <Users size={20} className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {metrics.uniqueCustomers}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">+24 new this month</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-amber-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('products')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Sold Products</h3>
                                <Package size={20} className="text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-amber-600">
                                {metrics.totalProducts}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{bestSellingProducts[0]?.name || 'N/A'} best seller</p>
                        </div>
                    </>
                );
            case 'orders':
                return (
                    <>
                        <div className="glass-card p-6 border-b-4 border-emerald-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('revenue')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Revenue</h3>
                                <DollarSign size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">₹{metrics.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Avg. ₹{(metrics.totalRevenue / metrics.totalOrders || 0).toFixed(0)} per order</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('orders')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Orders</h3>
                                <ShoppingCart size={20} className="text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{metrics.totalOrders}</p>
                            <p className="text-xs text-slate-400 mt-1">Pending: {orderStatusCounts.pending}</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('customers')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Avg Order Value</h3>
                                <TrendingUp size={20} className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                ₹{(metrics.totalRevenue / metrics.totalOrders || 0).toFixed(0)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">+5.3% from last month</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-amber-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('products')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Order Completion</h3>
                                <PackageCheck size={20} className="text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-amber-600">
                                {((orderStatusCounts.delivered / metrics.totalOrders) * 100 || 0).toFixed(0)}%
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Delivery rate</p>
                        </div>
                    </>
                );
            case 'customers':
                return (
                    <>
                        <div className="glass-card p-6 border-b-4 border-emerald-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('revenue')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Customers</h3>
                                <Users size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">{metrics.uniqueCustomers}</p>
                            <p className="text-xs text-slate-400 mt-1">Active users</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('orders')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Repeat Customers</h3>
                                <ShoppingCart size={20} className="text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {filteredRawOrders.filter((order, index, self) =>
                                    index !== self.findIndex(o => o.customer_id === order.customer_id)
                                ).length}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{((filteredRawOrders.length - metrics.uniqueCustomers) / metrics.totalOrders * 100 || 0).toFixed(0)}% repeat rate</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('customers')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Avg Orders/Customer</h3>
                                <TrendingUp size={20} className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {(metrics.totalOrders / metrics.uniqueCustomers || 0).toFixed(1)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Per customer</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-amber-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('products')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Customer Satisfaction</h3>
                                <PackageCheck size={20} className="text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-amber-600">96%</p>
                            <p className="text-xs text-slate-400 mt-1">Based on deliveries</p>
                        </div>
                    </>
                );
            case 'products':
                return (
                    <>
                        <div className="glass-card p-6 border-b-4 border-emerald-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('revenue')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Total Products Sold</h3>
                                <Package size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">{metrics.totalProducts}</p>
                            <p className="text-xs text-slate-400 mt-1">Units sold</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('orders')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Unique Products</h3>
                                <ShoppingCart size={20} className="text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-600">
                                {new Set(filteredRawOrders.map(o => o.product_name)).size}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Different products</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-purple-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('customers')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Top Product</h3>
                                <TrendingUp size={20} className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-bold text-purple-600 truncate" title={bestSellingProducts[0]?.name}>
                                {bestSellingProducts[0]?.name?.substring(0, 10) || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{bestSellingProducts[0]?.quantity || 0} units</p>
                        </div>
                        <div className="glass-card p-6 border-b-4 border-amber-500 cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('products')}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-slate-500 text-sm font-semibold">Categories</h3>
                                <PackageCheck size={20} className="text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-amber-600">{categoryData.length}</p>
                            <p className="text-xs text-slate-400 mt-1">Active categories</p>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-hidden">
                    <div className="flex flex-col flex-1 px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Start Date</span>
                        <input
                            type="date"
                            className="text-sm outline-none bg-transparent text-slate-800 font-medium w-full min-w-[130px] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="flex flex-col flex-1 px-4 py-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">End Date</span>
                        <input
                            type="date"
                            className="text-sm outline-none bg-transparent text-slate-800 font-medium w-full min-w-[130px] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors h-full flex items-center justify-center gap-1 font-medium text-sm"
                                title="Reset Filters"
                            >
                                <X size={20} />
                                Clear
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('revenue')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'revenue'
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Revenue
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'orders'
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={16} />
                        Orders
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'customers'
                        ? 'bg-purple-100 text-purple-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users size={16} />
                        Customers
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'products'
                        ? 'bg-amber-100 text-amber-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Package size={16} />
                        Products
                    </div>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderKPIContent()}
            </div>

            {/* Sales Overview and Best Selling Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Overview - Takes 2 columns */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500" />
                            Sales Overview
                        </h2>
                        <div className="flex gap-2">
                            <button className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">Weekly</button>
                            <button className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-50 rounded-full font-medium">Monthly</button>
                        </div>
                    </div>

                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                    name="Revenue (₹)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Total Sales</p>
                            <p className="text-lg font-bold text-slate-800">₹{metrics.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Best Day</p>
                            <p className="text-lg font-bold text-slate-800">
                                {salesData.reduce((max, day) => day.sales > max.sales ? day : max, salesData[0])?.name || 'N/A'}
                            </p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">Growth</p>
                            <p className="text-lg font-bold text-emerald-600">+12.5%</p>
                        </div>
                    </div>
                </div>

                {/* Best Selling Products */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Award size={20} className="text-amber-500" />
                            Best Sellers
                        </h2>
                        <span className="text-xs text-slate-400">Top 5 products</span>
                    </div>

                    <div className="space-y-4">
                        {bestSellingProducts.map((product, index) => (
                            <div key={product.name} className="group hover:bg-slate-50 p-3 rounded-lg transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                        index === 1 ? 'bg-slate-100 text-slate-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-50 text-blue-600'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{product.quantity} units</span>
                                            <span>•</span>
                                            <span>₹{product.revenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-emerald-600">
                                            {((product.quantity / metrics.totalProducts) * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-[10px] text-slate-400">share</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${index === 0 ? 'bg-amber-500' :
                                            index === 1 ? 'bg-slate-500' :
                                                index === 2 ? 'bg-orange-500' :
                                                    'bg-blue-500'
                                            }`}
                                        style={{ width: `${(product.quantity / bestSellingProducts[0].quantity) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Category Distribution */}
                    {categoryData.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Category Distribution</h3>
                            <div className="h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={60}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {categoryData.slice(0, 4).map((cat, idx) => (
                                    <div key={cat.name} className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-xs text-slate-600 truncate">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Product Launch Section */}
            {user?.role !== 'admin' && (
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

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {loading ? (
                            <SkeletonLoader type="card" count={3} className="col-span-full md:col-span-3 lg:col-span-4" />
                        ) : newProducts.map((product) => (
                            <div
                                key={product.product_id}
                                className="glass-card group overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1"
                                onClick={() => navigate('/place-order', { state: { preselectedProductId: product.product_id } })}
                            >
                                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                                    <img
                                        src={product.image_url || product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => { e.target.src = 'https://placehold.co/400?text=Product' }}
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10 pointer-events-none">
                                        {product.category}
                                    </div>
                                    <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm z-10">NEW</span>
                                    {product.stock <= 10 && (
                                        <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded shadow-lg z-10 shadow-red-500/30 animate-pulse pointer-events-none">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col pt-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight line-clamp-1">{product.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed" title={product.description}>
                                        {product.description || 'No additional details available.'}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between pt-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (product.stock > 10) {
                                                        navigate('/place-order', { state: { preselectedProductId: product.product_id } }); 
                                                    }
                                                }}
                                                disabled={product.stock <= 10}
                                                className={`px-4 py-2 font-bold text-[13px] rounded-lg shadow-sm transition-all flex items-center justify-center ${
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
                        ))}
                    </div>
                </div>
            )}

            {/* Orders Insights Section */}
            <div className="glass-panel p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-5">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 size={20} className="text-purple-500" />
                        Orders Insights
                    </h2>

                    {/* Order Status Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setOrderFilter('recent')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'recent'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}
                        >
                            <Clock size={14} />
                            Recent (5)
                        </button>
                        <button
                            onClick={() => setOrderFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'all'
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <ShoppingCart size={14} />
                            All ({orderStatusCounts.all})
                        </button>
                        <button
                            onClick={() => setOrderFilter('pending')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'pending'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                        >
                            <AlertCircle size={14} />
                            Pending ({orderStatusCounts.pending})
                        </button>
                        <button
                            onClick={() => setOrderFilter('approved')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'approved'
                                ? 'bg-cyan-500 text-white shadow-md'
                                : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                                }`}
                        >
                            <CircleDashed size={14} />
                            Approved ({orderStatusCounts.approved})
                        </button>
                        <button
                            onClick={() => setOrderFilter('dispatched')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'dispatched'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                        >
                            <Truck size={14} />
                            Dispatched ({orderStatusCounts.dispatched})
                        </button>
                        <button
                            onClick={() => setOrderFilter('delivered')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'delivered'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                        >
                            <CheckCircle2 size={14} />
                            Delivered ({orderStatusCounts.delivered})
                        </button>
                        <button
                            onClick={() => setOrderFilter('cancelled')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${orderFilter === 'cancelled'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            <PackageX size={14} />
                            Cancelled ({orderStatusCounts.cancelled})
                        </button>
                    </div>
                </div>



                {/* Orders Table */}
                <div className="overflow-x-auto pt-10">
                    {loading ? (
                        <SkeletonLoader type="table" count={5} />
                    ) : (
                        <>
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package size={48} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">No orders found</p>
                                    <p className="text-sm text-slate-400 mt-1">Try changing your filter selection</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                            <th className="pb-3 font-medium pl-4">Order ID</th>
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Customer Name</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Product Name</th>
                                            <th className="pb-3 font-medium">Qty</th>
                                            <th className="pb-3 font-medium">Expected Delivery</th>
                                            <th className="pb-3 font-medium text-right pr-4">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.map((order) => {
                                            const statusConfig = getStatusConfig(order.status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <tr
                                                    key={order.order_id}
                                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-4 pl-4 font-medium text-slate-900 font-mono text-xs">
                                                        {order.order_id.substring(0, 8)}...
                                                    </td>
                                                    <td className="py-4 text-slate-600 text-sm">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 text-slate-600 text-sm">
                                                        {order.customer_name}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                            <StatusIcon size={12} />
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-slate-600 text-sm max-w-[150px] truncate" title={order.product_name}>
                                                        {order.product_name}
                                                    </td>
                                                    <td className="py-4 text-slate-600 text-sm">{order.quantity}</td>
                                                    <td className="py-4 text-slate-600 text-sm">
                                                        {order.expected_delivery
                                                            ? new Date(order.expected_delivery).toLocaleDateString()
                                                            : 'Not set'
                                                        }
                                                    </td>
                                                    <td className="py-4 text-right pr-4 font-semibold text-slate-900">₹{order.amount}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}

                            {/* View All Link */}
                            <div className="mt-4 text-center">
                                <Link
                                    to={`/orders${orderFilter !== 'all' && orderFilter !== 'recent' ? `?status=${orderFilter}` : ''}`}
                                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm"
                                >
                                    View All {orderFilter !== 'all' && orderFilter !== 'recent' ? orderFilter : ''} Orders
                                    <ArrowUpRight size={16} />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;