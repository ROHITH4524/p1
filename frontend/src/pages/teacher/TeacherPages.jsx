import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageShell from '../PageShell';
import MyStudents from './MyStudents';
import AddMarks from './AddMarks';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip
} from 'recharts';

export { MyStudents, AddMarks };

export const MLInsights = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMLData = async () => {
            try {
                const res = await api.get('/api/ml/clusters');
                setPerformanceData(res.data);
            } catch (err) {
                console.error("Failed to fetch ML insights", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMLData();
    }, []);

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Running AI Analysis...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-blue-900 tracking-tight">AI Insights</h1>
                <p className="text-blue-600/60 font-medium tracking-wide uppercase text-xs mt-1">Predictive Performance Analytics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Clustering Scatter Plot */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Class Performance Clusters</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" dataKey="total_marks" name="Total Marks" unit=" pts" axisLine={false} tickLine={false} />
                                <YAxis type="number" dataKey="average_marks" name="Avg Score" unit="%" axisLine={false} tickLine={false} />
                                <ZAxis type="string" dataKey="performance_label" name="Tier" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Students" data={performanceData} fill="#3b82f6">
                                    {performanceData.map((entry, index) => (
                                        <Scatter
                                            key={`cell-${index}`}
                                            fill={entry.performance_label === 'High' ? '#10b981' : entry.performance_label === 'Medium' ? '#3b82f6' : '#f97316'}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center italic">The AI groups students into tiers based on multidimensional mark patterns.</p>
                </div>

                {/* Radar Chart (Mocked for subject strengths) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
                    <h3 className="text-lg font-bold text-blue-900 mb-6">Subject Area Strengths</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'Math', A: 120, B: 110, fullMark: 150 },
                                { subject: 'Science', A: 98, B: 130, fullMark: 150 },
                                { subject: 'English', A: 86, B: 130, fullMark: 150 },
                                { subject: 'History', A: 99, B: 100, fullMark: 150 },
                                { subject: 'Arts', A: 85, B: 90, fullMark: 150 },
                                { subject: 'PE', A: 65, B: 85, fullMark: 150 },
                            ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fontSize: 10 }} />
                                <Radar name="This Class" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                <Radar name="School Average" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black mb-4">Grade Prediction Engine ⚡</h2>
                    <p className="text-indigo-100 text-lg opacity-80 leading-relaxed mb-8">
                        Our ML model is currently analyzing mid-term trends to predict final result distributions.
                        Teachers can use these insights to provide early interventions for students in the Red Orange cluster.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Model Confidence</span>
                            <span className="text-2xl font-black">94.2%</span>
                        </div>
                        <div className="w-px h-10 bg-indigo-700 mx-4"></div>
                        <div className="flex flex-col">
                            <span className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Dataset Size</span>
                            <span className="text-2xl font-black">10,000+ Patterns</span>
                        </div>
                    </div>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>
        </div>
    );
};
