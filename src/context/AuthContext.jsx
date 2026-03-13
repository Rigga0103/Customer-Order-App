import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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

    const login = async (username, password) => {
        // Custom Auth: Query the public.users table for the matching email or phone
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${username},phone.eq.${username}`)
            .maybeSingle();

        // Check if user exists and password matches (temporarily plain text)
        if (userData && userData.password_hash === password) {

            // Fetch default address
            const { data: addressData } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', userData.id)
                .eq('is_default', true)
                .single();

            const userObj = {
                id: userData.id,
                name: userData.first_name,
                email: userData.email,
                role: userData.role,
                phone: userData.phone,
                avatar_url: userData.avatar_url,
                deliveryAddress: addressData ? {
                    state: addressData.state,
                    district: addressData.address_line2,
                    city: addressData.city,
                    address: addressData.address_line1,
                    postalCode: addressData.postal_code
                } : null
            };

            setUser(userObj);
            localStorage.setItem('currentUser', JSON.stringify(userObj));
            return true;
        }


        return false;
    };

    const signup = async ({ fullName, email, password, phone, state, district, city, address, postalCode }, roleParam = 'customer') => {
        // Custom Auth: Insert directly into public.users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    email: email,
                    first_name: fullName,
                    phone: phone,
                    password_hash: password, // Temporarily storing plain text as requested
                    role: roleParam
                }
            ])
            .select()
            .single();

        if (userError) {
            return userError.message;
        }

        const authUserId = userData.id;

        // Insert the user's address into the user_addresses table
        const { error: addressError } = await supabase.from('user_addresses').insert([
            {
                user_id: authUserId,
                full_name: fullName,
                phone: phone,
                address_line1: address,
                address_line2: district, // Using district as address_line2 optionally
                city: city,
                state: state,
                postal_code: postalCode,
                address_type: 'home',
                is_default: true
            }
        ]);

        if (addressError) {
            return addressError.message;
        }

        const userObj = {
            id: authUserId,
            name: fullName,
            email: email,
            role: roleParam,
            phone,
            avatar_url: null,
            deliveryAddress: { state, district, city, address, postalCode }
        };


        // Auto-login
        setUser(userObj);
        localStorage.setItem('currentUser', JSON.stringify(userObj));

        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const updateUser = (newData) => {
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
