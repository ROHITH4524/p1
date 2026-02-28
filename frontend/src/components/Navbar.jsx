import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
            <div className="text-xl font-bold text-blue-600">Student Analytics</div>
            <div className="flex items-center gap-4">
                {user && (
                    <>
                        <div className="text-gray-600">
                            <span className="font-semibold">{user.name}</span> ({user.role})
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm transition-colors"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
