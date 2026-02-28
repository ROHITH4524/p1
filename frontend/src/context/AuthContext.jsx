import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // stores { id, name, email, role, school_id }
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

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
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const login = (jwtToken) => {
        setToken(jwtToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    const getDashboardUrl = (role) => {
        switch (role) {
            case 'super_admin': return '/super-admin/dashboard';
            case 'school_admin': return '/school-admin/dashboard';
            case 'teacher': return '/teacher/dashboard';
            case 'student': return '/student/dashboard';
            default: return '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, getDashboardUrl }}>
            {children}
        </AuthContext.Provider>
    );
};
