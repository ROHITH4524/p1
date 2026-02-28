import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const MLInsights = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';
    const isTeacherOrAdmin = ['admin', 'teacher'].includes(user?.role);

    const [clusters, setClusters] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const [clustersRes, atRiskRes] = await Promise.all([
                api.get('/api/ml/clusters'),
                api.get('/api/ml/at-risk')
            ]);
            setClusters(clustersRes.data);
            setAtRisk(atRiskRes.data);
        } catch (err) {
            setError("Failed to fetch ML insights");
        } finally {
            setLoading(false);
        }
    };

    const getClusterBadge = (performance) => {
        switch (performance) {
            case 'High': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (!isTeacherOrAdmin) {
        return <div className="p-6">Access Denied</div>;
    }

    return (
        <div className="p-6 max-w-[90rem] mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Machine Learning Insights & Analytics</h1>
                <p className="text-gray-500 text-sm mt-1">AI-driven student performance monitoring based on automated K-Means KMeans algorithmic grouping.</p>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                    Analyzing ML Network Models...
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* At-Risk Students Block */}
                    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden flex flex-col">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                At-Risk Interventions Required
                            </h3>
                            <p className="text-xs text-red-600 mt-1">Students tracking below the 50% cumulative threshold target.</p>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[600px] p-6 bg-red-50/20">
                            {atRisk.length === 0 ? (
                                <div className="text-center py-10 text-emerald-600 font-medium">
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    No at-risk students detected.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {atRisk.map((student, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{student.student_name}</h4>
                                                <p className="text-sm text-gray-500">Class {student.class_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-red-600">{student.total_marks}</div>
                                                <div className="text-xs text-gray-500 font-medium">Cumul. Total</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KMeans Clustering Block */}
                    <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden flex flex-col">
                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                            <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                                K-Means AI Segmentation
                            </h3>
                            <p className="text-xs text-purple-600 mt-1">Students grouped automatically into 3 performance clusters tracking overall trajectory.</p>
                        </div>

                        <div className="flex-1 overflow-auto max-h-[600px]">
                            <table className="min-w-full divide-y divide-purple-100">
                                <thead className="bg-purple-50/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-purple-600 uppercase">Student Profile</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-purple-600 uppercase">Total Score</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-purple-600 uppercase">Algorithm Output</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {clusters.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{student.student_name}</div>
                                                <div className="text-xs text-gray-500">Class {student.class_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right font-medium">
                                                {student.total_marks}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded border ${getClusterBadge(student.performance_level)}`}>
                                                    {student.performance_level} Tier
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {clusters.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    No cluster data available. Run the machine learning jobs.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default MLInsights;
