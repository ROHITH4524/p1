import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) return null;

    const links = [
        // Super Admin
        { name: 'Dashboard', path: '/super-admin/dashboard', roles: ['super_admin'] },
        { name: 'Schools', path: '/super-admin/manage-schools', roles: ['super_admin'] },
        { name: 'Admins', path: '/super-admin/manage-admins', roles: ['super_admin'] },

        // School Admin
        { name: 'Overview', path: '/school-admin/dashboard', roles: ['school_admin'] },
        { name: 'Teachers', path: '/school-admin/manage-teachers', roles: ['school_admin'] },
        { name: 'Reports', path: '/school-admin/reports', roles: ['school_admin'] },

        // Teacher
        { name: 'Class View', path: '/teacher/dashboard', roles: ['teacher'] },
        { name: 'My Students', path: '/teacher/my-students', roles: ['teacher'] },
        { name: 'Add Marks', path: '/teacher/add-marks', roles: ['teacher'] },
        { name: 'ML Insights', path: '/teacher/ml-insights', roles: ['teacher'] },

        // Student
        { name: 'My Performance', path: '/student/dashboard', roles: ['student'] },
        { name: 'Full Report', path: '/student/my-report', roles: ['student'] },
    ];

    // Filter links by user role
    const visibleLinks = links.filter(link => link.roles.includes(user.role));

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
            <div className="mb-8 px-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">e</div>
                <span className="text-xl font-bold tracking-tight">eduFlow</span>
            </div>

            <div className="mb-4 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                {user.role.replace('_', ' ')} MENU
            </div>

            <nav className="space-y-1 flex-1">
                {visibleLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`block px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-gray-800">
                <div className="text-xs font-medium text-gray-500 italic">Connected as</div>
                <div className="text-sm font-bold text-blue-400 truncate">{user.name}</div>
            </div>
        </aside>
    );
};

export default Sidebar;
