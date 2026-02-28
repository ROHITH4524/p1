import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    // Get current section from URL path
    const pathParts = location.pathname.split('/');
    const currentSection = pathParts[pathParts.length - 1].replace(/-/g, ' ');

    return (
        <nav className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                <h1 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                    {currentSection || 'Dashboard'}
                </h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-blue-900 leading-none">{user.name}</span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mt-1">
                        {user.role.replace(/_/g, ' ')}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-100"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
