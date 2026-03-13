import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ListOrdered, Tag, AlertCircle, Package2, LogOut, X, Star, ShieldCheck, HelpCircle, Users, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: User, label: 'My Profile', path: '/profile' },
    ];

    if (user?.role === 'admin') {
        navItems.push(
            { icon: ShieldCheck, label: 'Customer Orders', path: '/admin/pending' },
            { icon: Users, label: 'Customer Details', path: '/admin/customers' },
            { icon: ListOrdered, label: 'All Orders', path: '/orders' },
            { icon: Package2, label: 'All Products', path: '/all-products' },
            { icon: Star, label: 'New Launches', path: '/new-products' },
            { icon: Tag, label: 'Schemes', path: '/schemes' },
            { icon: HelpCircle, label: 'Complaints', path: '/complaints' },
        );
    } else {
        navItems.push(
            { icon: ShoppingCart, label: 'Place Order', path: '/place-order' },
            { icon: Package2, label: 'All Products', path: '/all-products' },
            { icon: Package2, label: 'Not Tried', path: '/not-tried' },
            { icon: ListOrdered, label: 'My Orders', path: '/orders' },
            { icon: HelpCircle, label: 'Complaints', path: '/complaints' }
        );
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 shadow-2xl ring-1 ring-slate-900/5 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">Rigga Ind.</h1>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">
                                {user?.role === 'admin' ? 'ADMIN PANEL' : 'CUSTOMER PORTAL'}
                            </p>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => window.innerWidth < 768 && onClose()}
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 shadow-sm ring-1 ring-red-500/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={22} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                        <span className="font-medium tracking-wide">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="mb-3 px-2 text-xs text-slate-400">
                            Signed in as <span className="font-bold text-slate-600">{user?.name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-white hover:text-red-600 hover:shadow-md hover:shadow-red-500/10 hover:ring-1 hover:ring-red-100 transition-all duration-300"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
