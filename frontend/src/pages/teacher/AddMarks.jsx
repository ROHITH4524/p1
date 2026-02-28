import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AddMarks = () => {
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [marksData, setMarksData] = useState({}); // { studentId: { mid_term: 0, final_term: 0, assignment: 0 } }
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [studentRes, subjectRes] = await Promise.all([
                api.get('/api/teacher/my-students'),
                api.get('/api/teacher/subjects')
            ]);
            setStudents(studentRes.data);
            setSubjects(subjectRes.data);
            if (subjectRes.data.length > 0) setSelectedSubject(subjectRes.data[0].id);
        } catch (err) {
            console.error("Failed to fetch marks data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || { mid_term: 0, final_term: 0, assignment: 0 }),
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const handleSaveMarks = async () => {
        if (!selectedSubject) return alert("Please select a subject first");
        setIsSaving(true);
        try {
            const payloads = Object.entries(marksData).map(([studentId, marks]) => ({
                student_id: parseInt(studentId),
                subject_id: parseInt(selectedSubject),
                ...marks
            }));

            await api.post('/api/teacher/add-marks', { marks: payloads });
            alert("Marks updated successfully! ✅");
            setMarksData({});
        } catch (err) {
            alert("Failed to save marks");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading Marks Board...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Add/Edit Marks</h1>
                    <p className="text-blue-600/60 font-medium tracking-wide uppercase text-xs mt-1">Academic Data Entry</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select
                        className="px-6 py-3 bg-white border border-blue-100 text-blue-900 font-bold rounded-xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none"
                        value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button
                        onClick={handleSaveMarks}
                        disabled={isSaving || Object.keys(marksData).length === 0}
                        className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-95"
                    >
                        {isSaving ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50/50 border-b border-blue-50">
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest w-1/3">Student Name</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Mid-Term (50)</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Final-Term (50)</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-center">Assignment (50)</th>
                            <th className="px-8 py-5 text-xs font-black text-blue-900 uppercase tracking-widest text-right">Potential Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50/50">
                        {students.map(s => {
                            const currentMarks = marksData[s.id] || { mid_term: 0, final_term: 0, assignment: 0 };
                            const potentialTotal = (currentMarks.mid_term + currentMarks.final_term + currentMarks.assignment);

                            return (
                                <tr key={s.id} className="hover:bg-blue-50/10 transition-colors">
                                    <td className="px-8 py-5 font-bold text-blue-900">{s.name}</td>
                                    <td className="px-8 py-5 text-center">
                                        <input
                                            type="number" max="50" min="0"
                                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-center font-bold text-blue-900"
                                            placeholder="--"
                                            onChange={e => handleMarkChange(s.id, 'mid_term', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <input
                                            type="number" max="50" min="0"
                                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-center font-bold text-blue-900"
                                            placeholder="--"
                                            onChange={e => handleMarkChange(s.id, 'final_term', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <input
                                            type="number" max="50" min="0"
                                            className="w-20 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-center font-bold text-blue-900"
                                            placeholder="--"
                                            onChange={e => handleMarkChange(s.id, 'assignment', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-blue-600">
                                        {potentialTotal > 0 ? potentialTotal : "--"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl flex items-center gap-4 border border-blue-100">
                <span className="text-2xl text-blue-600">💡</span>
                <p className="text-sm text-blue-900 font-medium">
                    <span className="font-bold">Pro-tip:</span> You can update marks for multiple students across the same subject at once. Total marks and grades are automatically calculated on the server.
                </p>
            </div>
        </div>
    );
};

export default AddMarks;
