import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', subject_specialization: '' });
    const [showCredentials, setShowCredentials] = useState(null);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/api/school-admin/teachers');
            setTeachers(res.data);
        } catch (err) {
            console.error("Failed to fetch teachers", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/school-admin/add-teacher', newTeacher);
            setShowCredentials(res.data.credentials);
            setIsModalOpen(false);
            setNewTeacher({ name: '', email: '', password: '', subject_specialization: '' });
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to add teacher");
        }
    };

    const toggleTeacherActive = async (id) => {
        try {
            await api.put(`/api/school-admin/toggle-teacher/${id}`);
            fetchTeachers();
        } catch (err) {
            console.error("Failed to toggle teacher status", err);
        }
    };

    const deleteTeacher = async (id) => {
        if (!window.confirm("Are you sure? This will also remove or reassign their students.")) return;
        try {
            await api.delete(`/api/school-admin/teacher/${id}`, { data: { action: 'delete_students' } });
            fetchTeachers();
        } catch (err) {
            console.error("Failed to delete teacher", err);
        }
    };

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading Teachers...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Manage Teachers</h1>
                    <p className="text-blue-600/60 font-medium tracking-wide uppercase text-xs mt-1">School Faculty Administration</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Add Teacher
                </button>
            </div>

            {/* Credentials Alert After Creation */}
            {showCredentials && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-2xl relative shadow-sm border border-emerald-100 mb-6">
                    <button onClick={() => setShowCredentials(null)} className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600">×</button>
                    <h3 className="text-emerald-900 font-black flex items-center gap-2">Teacher Created Successfully! ✅</h3>
                    <p className="text-emerald-700 mt-2">Login: <span className="font-bold underline">{showCredentials.email}</span> / Password: <span className="font-bold underline">{showCredentials.password}</span></p>
                    <p className="text-xs text-emerald-600/60 mt-2 font-medium">Please share these credentials with the teacher immediately.</p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50/50 border-b border-blue-50">
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest">Name</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest">Email</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest">Subject</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Students</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50/50">
                        {teachers.map(t => (
                            <tr key={t.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-8 py-5 font-bold text-blue-900">{t.name}</td>
                                <td className="px-8 py-5 text-blue-600 font-medium">{t.email}</td>
                                <td className="px-8 py-5 text-gray-500 font-medium">{t.subject || "Not Assigned"}</td>
                                <td className="px-8 py-5 text-center">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black">{t.student_count}</span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <button
                                        onClick={() => toggleTeacherActive(t.id)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {t.is_active ? 'Active' : 'Deactivated'}
                                    </button>
                                </td>
                                <td className="px-8 py-5 text-right space-x-2">
                                    <button
                                        onClick={() => deleteTeacher(t.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-none"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Teacher Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-blue-900 tracking-tight">Add New Teacher</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-blue-300 hover:text-blue-600 transition-colors">×</button>
                        </div>
                        <form onSubmit={handleAddTeacher} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium text-blue-900"
                                        value={newTeacher.name} placeholder="e.g. John Smith"
                                        onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">Email Address</label>
                                    <input
                                        type="email" required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium text-blue-900"
                                        value={newTeacher.email} placeholder="john@school.com"
                                        onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">Set Password</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium text-blue-900"
                                        value={newTeacher.password} placeholder="••••••••"
                                        onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block ml-1 mb-1">Specialization</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium text-blue-900"
                                        value={newTeacher.subject_specialization} placeholder="e.g. Mathematics"
                                        onChange={e => setNewTeacher({ ...newTeacher, subject_specialization: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-lg"
                            >
                                Register Faculty Member
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
