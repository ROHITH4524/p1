import React, { useState, useEffect, useContext } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

const TeacherDashboard = () => {
    const { user } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [clusters, setClusters] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const [reportRes, clusterRes, atRiskRes] = await Promise.all([
                    api.get('/api/teacher/my-report'),
                    api.get('/api/ml/clusters'),
                    api.get('/api/ml/at-risk')
                ]);
                setReport(reportRes.data);
                setClusters(clusterRes.data);
                setAtRisk(atRiskRes.data);
            } catch (err) {
                console.error("Failed to fetch teacher dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeacherData();
    }, []);

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading Class Data...</div>;
    if (!report) return <div className="p-8 text-red-600">Failed to load classroom statistics.</div>;

    // Prepare Pie Chart data (Grade Distribution)
    const gradeCounts = report.reduce((acc, curr) => {
        acc[curr.grade] = (acc[curr.grade] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(gradeCounts).map(([name, value]) => ({ name, value }));

    // Prepare Bar Chart data (Student Performance)
    const barData = report.slice(0, 10).map(s => ({
        name: s.student_name.split(' ')[0], // First name for clarity
        marks: s.total
    }));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Class Analytics</h1>
                    <p className="text-blue-600/60 font-medium">Insights for {user?.name}'s Classroom</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">{clusters.length} Students Tracked</span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Students", val: report.length, icon: "👥", color: "blue" },
                    { label: "Class Average", val: `${(report.reduce((a, b) => a + b.total, 0) / report.length).toFixed(1)}/150`, icon: "🎯", color: "indigo" },
                    { label: "At-Risk Count", val: atRisk.length, icon: "⚠️", color: "red" },
                    { label: "Top Score", val: Math.max(...report.map(s => s.total)), icon: "🏆", color: "emerald" }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</span>
                            <span>{card.icon}</span>
                        </div>
                        <p className={`text-3xl font-black text-${card.color}-600 mt-2`}>{card.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Chart */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Student Grade Comparison (Top 10)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="marks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grade Mix Pie */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Grade Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ML Performance Clusters */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">AI Performance Clusters 🧠</h3>
                    <div className="space-y-3">
                        {clusters.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="font-bold text-gray-700 text-sm">{c.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${c.performance_label === 'High' ? 'bg-emerald-100 text-emerald-600' :
                                    c.performance_label === 'Medium' ? 'bg-blue-100 text-blue-600' :
                                        'bg-orange-100 text-orange-600'
                                    }`}>{c.performance_label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* At-Risk Alerts */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">At-Risk Student Warnings 🚩</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {atRisk.length > 0 ? atRisk.map((s, i) => (
                            <div key={i} className="p-4 border border-red-50 bg-red-50/20 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-red-900">{s.student_name}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-lg font-black uppercase">{s.class_name}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-xs text-red-600/60 font-medium">Total Marks: {s.total_marks}/150</p>
                                    <button className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest underline underline-offset-4">Add Extra Marks</button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-10">
                                <p className="text-emerald-500 font-bold">Excellent! No students currently at risk. 🌟</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
