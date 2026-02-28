import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useContext(AuthContext);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If roles are specified and user's role isn't in them, redirect to their home
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
