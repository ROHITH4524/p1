import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // stores { id, name, email, role }
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // When token changes, either fetch user profile or clear it
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            fetchUserProfile();
        } else {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to fetch user profile", err);
            // If token is invalid (e.g., 401 Unauthorized), logout automatically
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (jwtToken) => {
        setLoading(true);
        setToken(jwtToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
