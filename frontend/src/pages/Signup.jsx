import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', role: 'student'
    });
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };
            await api.post('/api/auth/signup', payload);
            setSuccessMsg('Account created successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred during registration.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-blue-100">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Create an Account</h2>
                    <p className="mt-2 text-sm text-gray-600">Join the Student Analytics Platform</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                            <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text" name="name" required
                                value={formData.name} onChange={handleChange}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email" name="email" required
                                value={formData.email} onChange={handleChange}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="you@school.edu"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password" name="password" required minLength={8}
                                value={formData.password} onChange={handleChange}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password" name="confirmPassword" required minLength={8}
                                value={formData.confirmPassword} onChange={handleChange}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                name="role" required
                                value={formData.role} onChange={handleChange}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || successMsg !== ''}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-center">
                        <div className="text-sm">
                            <span className="text-gray-500">Already have an account? </span>
                            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
