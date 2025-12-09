import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('user');
    const [password, setPassword] = useState('user123'); // Pre-fill for convenience as requested
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const success = login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 animate-fade-in-up">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">Rigga Industries</h1>
                    <p className="text-slate-500">Welcome back! Please login to your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Username</label>
                        <div className="relative group">
                            <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Enter username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                        <span>Sign In</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-400 space-y-2">
                    <p
                        className="cursor-pointer hover:text-red-500 transition-colors inline-block px-2 py-1 rounded hover:bg-red-50"
                        onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                    >
                        <strong>Admin:</strong> admin / admin123
                    </p>
                    <div className="w-full"></div>
                    <p
                        className="cursor-pointer hover:text-red-500 transition-colors inline-block px-2 py-1 rounded hover:bg-red-50"
                        onClick={() => { setUsername('user'); setPassword('user123'); }}
                    >
                        <strong>User:</strong> user / user123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
