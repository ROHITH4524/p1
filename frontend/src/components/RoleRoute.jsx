import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
    const { user, getDashboardUrl, loading } = useContext(AuthContext);

    // If still fetching me profile, show nothing or small loader
    if (loading) return null;

    // If roles are specified and user's role isn't in them, redirect to their home
    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDashboardUrl(user.role)} replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
