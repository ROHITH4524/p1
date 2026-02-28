import React, { useState, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setMessage({ type: 'error', text: "Passwords don't match" });
        }
        if (newPassword.length < 6) {
            return setMessage({ type: 'error', text: "Password must be at least 6 characters" });
        }

        setIsLoading(true);
        try {
            await api.post('/api/auth/change-password', {
                old_password: user?.name, // Use current name as old password for default reset
                new_password: newPassword
            });
            setMessage({ type: 'success', text: "Password updated! Logging out..." });
            setTimeout(() => {
                window.location.reload(); // Force re-auth
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to update password";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                        🔐
                    </div>
                    <h2 className="text-2xl font-black text-blue-900 tracking-tight">Security Update Required</h2>
                    <p className="text-sm text-blue-600/60 font-medium mt-2">Please set a secure password before proceeding.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">New Password</label>
                        <input
                            type="password" required
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">Confirm Password</label>
                        <input
                            type="password" required
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit" disabled={isLoading}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg text-lg"
                    >
                        {isLoading ? "Updating..." : "Secure My Account"}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
                        After updating, you will be asked to sign in again with your new credentials.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
