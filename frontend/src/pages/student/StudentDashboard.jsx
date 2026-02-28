import React, { useState, useEffect, useContext } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [dashboard, setDashboard] = useState(null);
    const [marks, setMarks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const [dashRes, marksRes] = await Promise.all([
                    api.get('/api/student/my-dashboard'),
                    api.get('/api/student/my-marks')
                ]);
                setDashboard(dashRes.data);
                setMarks(marksRes.data);

                // Show modal if user is using default password
                if (user?.is_default_password) {
                    setShowPasswordModal(true);
                }
            } catch (err) {
                console.error("Failed to fetch student data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudentData();
    }, [user]);

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Fetching Your Academic Profile...</div>;
    if (!dashboard) return <div className="p-8 text-red-600">Failed to load dashboard data.</div>;

    const radarData = marks.map(m => ({
        subject: m.subject_name,
        score: m.total,
        fullMark: 150
    }));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Welcome back, {user?.name}! 👋</h1>
                    <p className="text-blue-600/60 font-medium">Keep pushing, you're doing great!</p>
                </div>
                <div className={`px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest ${dashboard.performance_tier === 'High' ? 'bg-emerald-100 text-emerald-600' :
                    dashboard.performance_tier === 'Medium' ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                    }`}>
                    Tier: {dashboard.performance_tier}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Overall Average", val: `${dashboard.average_total_marks.toFixed(1)}/150`, icon: "🎯", color: "blue" },
                    { label: "Best Subject", val: dashboard.best_subject, icon: "🔥", color: "emerald" },
                    { label: "Weakest Area", val: dashboard.weakest_subject, icon: "💡", color: "orange" },
                    { label: "Overall Grade", val: dashboard.overall_grade, icon: "⭐", color: "indigo" }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</span>
                            <span>{card.icon}</span>
                        </div>
                        <p className={`text-2xl font-black text-${card.color}-600 mt-2`}>{card.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Subject Performance Bar Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Marks per Subject</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={marks}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-100/50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Strengths Visualization</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fontSize: 10 }} />
                                <Radar name="My Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Marks Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <div className="px-8 py-6 border-b border-blue-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-blue-900">Score Breakdown</h3>
                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Download Data</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-blue-50/30">
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest">Subject</th>
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest text-center">Mid Term</th>
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest text-center">Final Term</th>
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest text-center">Assignment</th>
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest text-center">Total</th>
                                <th className="px-8 py-4 text-xs font-black text-blue-900/40 uppercase tracking-widest text-right">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50">
                            {marks.map((m, i) => (
                                <tr key={i} className="hover:bg-blue-50/10 transition-colors">
                                    <td className="px-8 py-5 font-bold text-blue-900">{m.subject_name}</td>
                                    <td className="px-8 py-5 text-center text-gray-500">{m.mid_term}</td>
                                    <td className="px-8 py-5 text-center text-gray-500">{m.final_term}</td>
                                    <td className="px-8 py-5 text-center text-gray-500">{m.assignment}</td>
                                    <td className="px-8 py-5 text-center font-black text-blue-600">{m.total}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${m.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                            m.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                m.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>{m.grade}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
