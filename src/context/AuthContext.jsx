import React, { createContext, useContext, useState, useEffect } from 'react';
import { LS } from '../utils/LSHelpers';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        const users = LS.get('ri_users');
        // Check against id (username) and password
        const foundUser = users.find(u => u.id === username && u.password === password);

        if (foundUser) {
            // Don't store password in local session
            const { password, ...userWithoutPass } = foundUser;
            setUser(userWithoutPass);
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPass));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
