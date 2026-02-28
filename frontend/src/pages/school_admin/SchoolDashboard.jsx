import React, { useState, useEffect, useContext } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'];

const SchoolDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [atRisk, setAtRisk] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, atRiskRes] = await Promise.all([
                    api.get('/api/school-admin/dashboard'),
                    api.get('/api/ml/at-risk')
                ]);
                setStats(dashboardRes.data);
                setAtRisk(atRiskRes.data);
            } catch (err) {
                console.error("Failed to fetch school dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading School Data...</div>;
    if (!stats) return <div className="p-8 text-red-600">Failed to load school statistics.</div>;

    // Transform grade distribution for PieChart
    const pieData = Object.entries(stats.grade_distribution).map(([name, value]) => ({ name, value }));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-blue-900 tracking-tight">School Overview</h1>
                <p className="text-blue-600/60 font-medium">{user?.school_name || "City High School"} Admin Panel</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Teachers", val: stats.total_teachers, icon: "👨‍🏫", color: "blue" },
                    { label: "Total Students", val: stats.total_students, icon: "🎓", color: "indigo" },
                    { label: "School Avg Marks", val: `${stats.average_marks}/150`, icon: "📈", color: "emerald" },
                    { label: "At-Risk Students", val: stats.at_risk_count, icon: "⚠️", color: "red" }
                ].map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</h3>
                            <span className="text-2xl">{card.icon}</span>
                        </div>
                        <p className={`text-3xl font-black text-${card.color}-600 mt-2`}>{card.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Teacher Performance Bar Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Class Performance by Teacher</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.teacher_performance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="teacher_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="avg_score" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grade Distribution Pie Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Overall Grade Distribution</h3>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top 5 Performers */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Top Performers 🏆</h3>
                    <div className="space-y-4">
                        {stats.top_performers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                                    <span className="font-bold text-blue-900">{p.name}</span>
                                </div>
                                <span className="font-black text-blue-600">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* At-Risk Students Alerts */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">At-Risk Alerts 🚩</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {atRisk.length > 0 ? atRisk.map((s, i) => (
                            <div key={i} className="flex flex-col p-4 border border-red-100 bg-red-50/30 rounded-2xl">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-red-900">{s.student_name}</span>
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">{s.class_name}</span>
                                </div>
                                <p className="text-xs text-red-600/70 mt-1">Teacher: {s.teacher_name}</p>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-sm font-bold text-red-700">Total: {s.total_marks}/150</span>
                                    <span className="text-xs font-black text-red-400">Needs Attention</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-emerald-600 font-bold col-span-2">No students currently at risk! 🎉</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;
