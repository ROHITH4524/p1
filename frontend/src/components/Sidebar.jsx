import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) return null;

    const links = [
        { name: 'Dashboard', path: '/', roles: ['admin', 'teacher', 'student'] },
        { name: 'Students', path: '/students', roles: ['admin', 'teacher'] },
        { name: 'Marks', path: '/marks', roles: ['admin', 'teacher', 'student'] },
        { name: 'ML Insights', path: '/ml-insights', roles: ['admin', 'teacher'] },
    ];

    // Filter links by user role
    const visibleLinks = links.filter(link => link.roles.includes(user.role));

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
            <div className="mb-8 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Menu
            </div>
            <nav className="space-y-1">
                {visibleLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`block px-4 py-3 rounded-md transition-colors ${isActive
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
