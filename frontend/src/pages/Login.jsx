import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user, getDashboardUrl } = useContext(AuthContext);

    // If user is already logged in, redirect them to their specific dashboard
    useEffect(() => {
        if (user) {
            navigate(getDashboardUrl(user.role));
        }
    }, [user, navigate, getDashboardUrl]);

    const decodeTokenRole = (token) => {
        try {
            // Basic base64 decode of JWT payload without external library
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (e) {
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const token = res.data.access_token;
            login(token);

            // Immediate redirection based on token role
            const role = decodeTokenRole(token);
            if (role) {
                navigate(getDashboardUrl(role));
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (detail === "User account is deactivated") {
                setError("Your account has been deactivated. Contact your administrator");
            } else {
                setError('Invalid email or password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-2xl border border-blue-50">
                <div className="text-center">
                    {/* School Logo Placeholder */}
                    <div className="mx-auto h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3 mb-6 transition-transform hover:rotate-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-black text-blue-900 tracking-tight">eduFlow</h2>
                    <p className="mt-2 text-blue-600/60 font-semibold tracking-wide uppercase text-xs">Student Performance Analytics</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-pulse">
                            <p className="text-sm text-red-700 font-bold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="group">
                            <label className="text-xs font-bold uppercase tracking-widest text-blue-900/40 ml-1 transition-colors group-focus-within:text-blue-600">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="block w-full px-5 py-4 mt-2 bg-gray-50 border border-gray-100 placeholder-gray-300 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                                placeholder="name@school.com"
                            />
                        </div>
                        <div className="group">
                            <label className="text-xs font-bold uppercase tracking-widest text-blue-900/40 ml-1 transition-colors group-focus-within:text-blue-600">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="block w-full px-5 py-4 mt-2 bg-gray-50 border border-gray-100 placeholder-gray-300 text-blue-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Sign In to Dashboard</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>

                    <div className="text-center pt-6 border-t border-gray-100">
                        <p className="text-sm text-blue-300 font-medium">
                            Forgot password? Contact your administrator
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
