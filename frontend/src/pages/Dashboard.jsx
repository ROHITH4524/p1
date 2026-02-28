import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [marksData, setMarksData] = useState([]);
    const [subjectAverages, setSubjectAverages] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isStudent = user?.role === 'student';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fire all read operations concurrently
                const fetches = [api.get('/api/marks/report')];

                // Admins and teachers pull additional analytics
                if (!isStudent) {
                    fetches.push(api.get('/api/marks/subject-average'));
                    fetches.push(api.get('/api/ml/at-risk'));
                    fetches.push(api.get('/api/ml/clusters'));
                }

                const responses = await Promise.all([...fetches].map(p => p.catch(e => e)));

                // Handle potential route rejections gracefully 
                if (!(responses[0] instanceof Error)) setMarksData(responses[0].data);
                if (!isStudent) {
                    if (!(responses[1] instanceof Error)) setSubjectAverages(responses[1].data);
                    if (!(responses[2] instanceof Error)) setAtRiskStudents(responses[2].data);
                    if (!(responses[3] instanceof Error)) setClusters(responses[3].data);
                }

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load some dashboard metrics.");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user, isStudent]);

    // Derive Statistics dynamically
    const stats = useMemo(() => {
        if (!marksData.length) return { totalStudents: 0, avgMarks: 0, topPerformer: 'N/A' };

        // Group marks by student for totals
        const studentTotals = marksData.reduce((acc, curr) => {
            if (!acc[curr.student_name]) acc[curr.student_name] = 0;
            acc[curr.student_name] += curr.total;
            return acc;
        }, {});

        const uniqueStudents = Object.keys(studentTotals).length;
        let maxMarks = -1;
        let topStudent = 'N/A';
        let totalScoreSum = 0;

        Object.entries(studentTotals).forEach(([name, total]) => {
            totalScoreSum += total;
            if (total > maxMarks) {
                maxMarks = total;
                topStudent = name;
            }
        });

        return {
            totalStudents: uniqueStudents,
            avgMarks: uniqueStudents ? (totalScoreSum / uniqueStudents).toFixed(1) : 0,
            topPerformer: topStudent
        };
    }, [marksData]);

    // Aggregate Grade distributions
    const gradeDistribution = useMemo(() => {
        const dist = { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
        marksData.forEach(mark => {
            if (dist[mark.grade] !== undefined) dist[mark.grade]++;
        });
        return Object.entries(dist).map(([name, value]) => ({ name, value }));
    }, [marksData]);

    // Prepare Bar Chart Data (Totals per student)
    const barChartData = useMemo(() => {
        const studentMap = {};
        marksData.forEach(row => {
            if (!studentMap[row.student_name]) {
                studentMap[row.student_name] = { name: row.student_name, total: 0 };
            }
            studentMap[row.student_name].total += row.total;
        });
        return Object.values(studentMap);
    }, [marksData]);

    const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#FCD34D', '#EF4444'];
    const BADGE_COLORS = {
        "High": "bg-green-100 text-green-800 border-green-200",
        "Medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Low": "bg-red-100 text-red-800 border-red-200"
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
                {error && <span className="text-sm text-red-500 bg-red-50 px-3 py-1 rounded">{error}</span>}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total {isStudent ? 'Assessments' : 'Students'}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{isStudent ? marksData.length : stats.totalStudents}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Average Marks</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.avgMarks}</h3>
                    </div>
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                </div>
                {!isStudent && (
                    <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">At-Risk Students</p>
                            <h3 className="text-2xl font-bold text-red-600">{atRiskStudents.length}</h3>
                        </div>
                        <div className="h-12 w-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                    </div>
                )}
                <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Top Performer</p>
                        <h3 className="text-lg font-bold text-gray-900 truncate max-w-[120px]" title={stats.topPerformer}>{stats.topPerformer}</h3>
                    </div>
                    <div className="h-12 w-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Performance</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer>
                            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="total" name="Total Marks" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Distribution</h3>
                    <div className="h-80 w-full relative">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={gradeDistribution} innerRadius={60} outerRadius={100}
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    {gradeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart: Subject Averages */}
                {!isStudent && subjectAverages.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Subject Averages Trend</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <LineChart data={subjectAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="subject_name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Line type="monotone" dataKey="average_total" name="Avg Total" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ML At-Risk Alert Section */}
                {!isStudent && (
                    <div className="space-y-6">
                        {/* At Risk Panel */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    At-Risk Students
                                </h3>
                                <span className="bg-red-200 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{atRiskStudents.length} Detected</span>
                            </div>
                            <div className="p-0 max-h-48 overflow-y-auto">
                                {atRiskStudents.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-500">No students currently at risk.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {atRiskStudents.map((student, idx) => (
                                            <li key={idx} className="p-4 hover:bg-red-50/50 transition-colors flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{student.student_name}</p>
                                                    <p className="text-xs text-gray-500">{student.class_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-red-600">{student.total_marks}</p>
                                                    <p className="text-xs text-gray-400">Total Marks</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Performance Clusters Preview */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Clustered Analysis
                                </h3>
                            </div>
                            <div className="p-0 max-h-[14rem] overflow-y-auto">
                                <ul className="divide-y divide-gray-100">
                                    {clusters.slice(0, 5).map((cluster, idx) => (
                                        <li key={idx} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-sm font-medium text-gray-900">{cluster.name}</span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${BADGE_COLORS[cluster.performance_label]}`}>
                                                {cluster.performance_label} Tier
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {clusters.length > 5 && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                                        <span className="text-xs text-gray-500 font-medium">View detailed clusters in ML Insights tab</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
