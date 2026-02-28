import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const MyStudents = () => {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', age: '', gender: 'Male', class: '' });
    const [showCredentials, setShowCredentials] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/api/teacher/my-students');
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to fetch students", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newStudent,
                class_name: newStudent.class
            };
            const res = await api.post('/api/teacher/add-student', payload);
            setShowCredentials(res.data);
            setIsModalOpen(false);
            setNewStudent({ name: '', age: '', gender: 'Male', class: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to add student");
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', csvFile);
        try {
            const res = await api.post('/api/teacher/add-students-csv', formData);
            alert(`Successfully added ${res.data.count} students!`);
            fetchStudents();
            setCsvFile(null);
        } catch (err) {
            alert("Failed to upload CSV");
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading Students...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">My Students</h1>
                    <p className="text-blue-600/60 font-medium tracking-wide uppercase text-xs mt-1">Classroom Management</p>
                </div>
                <div className="flex gap-4">
                    <label className="px-6 py-3 bg-white border border-blue-100 text-blue-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2">
                        {isUploading ? "Uploading..." : "📂 Import CSV"}
                        <input type="file" className="hidden" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} />
                    </label>
                    {csvFile && (
                        <button onClick={handleCsvUpload} className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 animate-bounce">
                            Confirm Upload
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Add Student
                    </button>
                </div>
            </div>

            {/* Credentials Alert */}
            {showCredentials && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-2xl relative shadow-sm border border-emerald-100 mb-6">
                    <button onClick={() => setShowCredentials(null)} className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600">×</button>
                    <h3 className="text-emerald-900 font-black">Student Added! ✅</h3>
                    <p className="text-emerald-700 mt-2">Login: <span className="font-bold underline">{showCredentials.login_email}</span> / Password: <span className="font-bold underline">{showCredentials.login_password}</span></p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50/50 border-b border-blue-50">
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest">Name</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest">Class</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Marks Score</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Grade</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-right">Performance Tier</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50/50">
                        {students.map(s => (
                            <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-blue-900">{s.name}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">Age: {s.age} | {s.gender}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 font-black text-blue-400 text-xs">{s.class}</td>
                                <td className="px-8 py-5 text-center font-black text-blue-900">{s.total_marks}/150</td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${s.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                        s.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                            s.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>{s.grade}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.performance_tier === 'High' ? 'bg-emerald-500 text-white' :
                                        s.performance_tier === 'Medium' ? 'bg-indigo-500 text-white' :
                                            'bg-orange-500 text-white'
                                        }`}>{s.performance_tier}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-black text-blue-900 mb-6">New Student Registration</h2>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <input
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                placeholder="Full Name" value={newStudent.name}
                                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number" className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    placeholder="Age" value={newStudent.age}
                                    onChange={e => setNewStudent({ ...newStudent, age: e.target.value })} required
                                />
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <input
                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                placeholder="Class (e.g. 10th Grade)" value={newStudent.class}
                                onChange={e => setNewStudent({ ...newStudent, class: e.target.value })} required
                            />
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg text-lg">
                                Add to Class
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-gray-400 font-bold hover:text-gray-600">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyStudents;
