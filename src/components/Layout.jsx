import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard';
            case '/place-order': return 'Place New Order';
            case '/orders': return 'Order History';
            case '/schemes': return 'Active Schemes';
            case '/complaints': return 'Support & Complaints';
            case '/new-products': return 'New Product Launches';
            case '/not-tried': return 'Products Not Tried';
            case '/admin/pending': return 'Admin Console';
            default: return 'Rigga Industries';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] selection:bg-red-100 selection:text-red-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="md:ml-72 min-h-screen flex flex-col transition-all duration-300">
                <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-white/70 backdrop-blur-xl border-b border-white/40 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2.5 rounded-xl hover:bg-white text-slate-500 hover:text-red-600 transition-colors shadow-sm ring-1 ring-slate-200/50"
                        >
                            <Menu size={22} />
                        </button>
                        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{getPageTitle()}</h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full border border-slate-200/50 focus-within:bg-white focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-100 transition-all w-64">
                            <Search size={18} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                            />
                        </div>

                        <button className="relative p-2.5 rounded-full hover:bg-white text-slate-400 hover:text-red-600 transition-all hover:shadow-lg hover:shadow-red-500/10">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-400 font-medium capitalize">{user?.role || 'Guest'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-xl shadow-red-500/20 ring-2 ring-white cursor-pointer hover:scale-105 transition-transform">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
