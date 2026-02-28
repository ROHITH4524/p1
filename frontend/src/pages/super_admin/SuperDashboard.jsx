import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const SuperDashboard = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/super-admin/dashboard');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch super admin stats", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading Platform Stats...</div>;

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <h1 className="text-4xl font-black text-blue-900 tracking-tight mb-8">Platform Global Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-blue-50 hover:border-blue-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Total Schools</h3>
                    <p className="text-6xl font-black text-blue-900 mt-4 tabular-nums">{stats?.total_schools || 0}</p>
                    <p className="mt-4 text-blue-600/60 font-medium text-sm">Managing across multiple regions</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-blue-50 hover:border-blue-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Global Teachers</h3>
                    <p className="text-6xl font-black text-blue-900 mt-4 tabular-nums">{stats?.total_teachers || 0}</p>
                    <p className="mt-4 text-blue-600/60 font-medium text-sm">Expert educators on platform</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-blue-50 hover:border-blue-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Global Students</h3>
                    <p className="text-6xl font-black text-blue-900 mt-4 tabular-nums">{stats?.total_students || 0}</p>
                    <p className="mt-4 text-blue-600/60 font-medium text-sm">Empowering next gen talent</p>
                </div>
            </div>

            {/* Additional visualizations can go here */}
            <div className="mt-12 bg-blue-900 p-12 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black">System Running at Full Scale</h2>
                    <p className="mt-4 text-blue-200 max-w-2xl text-lg">
                        The platform is currently managing {stats?.total_schools} schools with a total of {(stats?.total_students || 0) + (stats?.total_teachers || 0)} active users.
                        Performance levels remain optimal across all multi-tenant partitions.
                    </p>
                </div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-10"></div>
            </div>
        </div>
    );
};

export default SuperDashboard;
