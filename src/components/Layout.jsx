import React, { useState } from 'react';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { Menu, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const getPageTitle = () => {
        if (location.pathname.startsWith('/purchase-history')) return 'Purchase History';

        switch (location.pathname) {
            case '/': return 'Dashboard';
            case '/profile': return 'My Profile';
            case '/place-order': return 'Place New Order';
            case '/orders': return user?.role === 'admin' ? 'All Orders' : 'My Orders';
            case '/schemes': return 'Active Schemes';
            case '/complaints': return 'Support & Complaints';
            case '/new-products': return 'New Launches';
            case '/not-tried': return 'Products Not Tried';
            case '/all-products': return 'All Products';
            case '/admin/customers': return 'Customer Details';
            case '/admin/pending': return 'Customer Orders';
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
                        {/* Notification Bell + Panel */}
                        <NotificationPanel />

                        <div 
                            className="flex items-center gap-3 pl-3 border-l border-slate-200 cursor-pointer group"
                            onClick={() => navigate('/profile')}
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-slate-700 group-hover:text-red-600 transition-colors">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-400 font-medium capitalize">{user?.role || 'Guest'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-xl shadow-red-500/20 ring-2 ring-white group-hover:scale-105 transition-transform overflow-hidden">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase() || 'U'
                                )}
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
