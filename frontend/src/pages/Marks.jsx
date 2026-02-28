import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Marks = () => {
    const { user } = useContext(AuthContext);
    const isTeacherOrAdmin = ['admin', 'teacher'].includes(user?.role);
    const isStudent = user?.role === 'student';

    const [marks, setMarks] = useState([]);
    const [subjectAverages, setSubjectAverages] = useState([]);
    const [students, setStudents] = useState([]); // For add modal
    // subjects conceptually mapped dynamically from existing distinct DB data or hardcoded based on seed
    const [subjects, setSubjects] = useState([{ id: 1, name: 'Mathematics' }, { id: 2, name: 'Physics' }, { id: 3, name: 'Chemistry' }]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    // Add Form Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '', subject_id: '', mid_term: '', final_term: '', assignment: ''
    });

    // ML Predictor Panel
    const [predictorData, setPredictorData] = useState({ mid_term: '', assignment: '' });
    const [prediction, setPrediction] = useState(null);
    const [predictLoading, setPredictLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const resMarks = await api.get('/api/marks/report');
            setMarks(resMarks.data);

            if (isTeacherOrAdmin) {
                const resAvgs = await api.get('/api/marks/subject-average');
                setSubjectAverages(resAvgs.data);

                // Fetch students to populate the dropdown
                const resStudents = await api.get('/api/students/all');
                setStudents(resStudents.data);
            }
        } catch (err) {
            setError("Failed to fetch marks data");
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePredictorChange = (e) => setPredictorData({ ...predictorData, [e.target.name]: e.target.value });

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/api/marks/add', {
                student_id: parseInt(formData.student_id),
                subject_id: parseInt(formData.subject_id),
                mid_term: parseFloat(formData.mid_term),
                final_term: parseFloat(formData.final_term),
                assignment: parseFloat(formData.assignment)
            });
            setIsAddModalOpen(false);
            setFormData({ student_id: '', subject_id: '', mid_term: '', final_term: '', assignment: '' });
            fetchData(); // Refresh table
        } catch (err) {
            alert(err.response?.data?.detail || "Error adding marks");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        setPredictLoading(true);
        try {
            const res = await api.post('/api/ml/predict-grade', {
                mid_term: parseFloat(predictorData.mid_term),
                assignment: parseFloat(predictorData.assignment)
            });
            setPrediction(res.data);
        } catch (err) {
            alert("Prediction failed. " + (err.response?.data?.detail || ""));
        } finally {
            setPredictLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Student Performance Marks Report", 14, 15);

        const tableColumn = ["Student Name", "Class", "Subject", "Mid Term", "Final Term", "Assignment", "Total", "Grade"];
        const tableRows = [];

        filteredMarks.forEach(m => {
            tableRows.push([
                m.student_name, m.class_name, m.subject_name,
                m.mid_term, m.final_term, m.assignment, m.total, m.grade
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save("Marks_Report.pdf");
    };

    const filteredMarks = marks.filter(m =>
        (m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.class_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (subjectFilter === '' || m.subject_name === subjectFilter)
    );

    // Dynamic distinct subjects list derived from the marks list for the filter
    const uniqueFilterSubjects = [...new Set(marks.map(m => m.subject_name))];

    const getBadgeColor = (grade) => {
        switch (grade) {
            case 'A+': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'A': return 'bg-green-100 text-green-800 border-green-200';
            case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-red-100 text-red-800 border-red-200'; // F
        }
    };

    return (
        <div className="p-6 max-w-[90rem] mx-auto space-y-6 flex flex-col xl:flex-row gap-6">
            {/* Main Left Content: Table and Controls */}
            <div className="flex-1 space-y-6 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Marks & Grades</h1>
                        <p className="text-gray-500 text-sm">Review subject performance, assignments, and calculated totals.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={exportPDF}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                            Export PDF
                        </button>
                        {isTeacherOrAdmin && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Marks
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by name or class..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">All Subjects</option>
                            {uniqueFilterSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                Loading marks data...
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
                        ) : filteredMarks.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No marks found.</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                        {isTeacherOrAdmin && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>}
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Mid Term</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Final Term</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Assignment</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase bg-gray-100">Total</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMarks.map((m, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.student_name}</td>
                                            {isTeacherOrAdmin && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.class_name}</td>}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{m.subject_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{m.mid_term}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{m.final_term}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{m.assignment}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50 text-right">{m.total}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md border ${getBadgeColor(m.grade)}`}>
                                                    Grade {m.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Bottom Subject Summary */}
                {isTeacherOrAdmin && subjectAverages.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden mt-6">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Subject Averages Summary
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            {subjectAverages.map((avg, i) => (
                                <div key={i} className="p-6">
                                    <p className="text-sm font-medium text-gray-500 mb-1">{avg.subject_name}</p>
                                    <h4 className="text-2xl font-bold text-gray-900">{avg.average_total} <span className="text-sm font-normal text-gray-400">avg total</span></h4>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Right Content: ML Predictor Side Panel */}
            <div className="w-full xl:w-96 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-md border border-indigo-100 sticky top-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
                        <div className="flex items-center gap-3 mb-1">
                            <svg className="w-6 h-6 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            <h3 className="text-lg font-bold">ML Grade Predictor</h3>
                        </div>
                        <p className="text-indigo-100 text-xs">AI forecasts likely final grades before finals are held tracking midterm baseline velocity.</p>
                    </div>

                    <form onSubmit={handlePredict} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Mid Term Score</label>
                            <div className="relative">
                                <input type="number" name="mid_term" required min="0" max="100" step="0.1" value={predictorData.mid_term} onChange={handlePredictorChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50" placeholder="e.g. 85.5" />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">/100</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Assignment Avg</label>
                            <div className="relative">
                                <input type="number" name="assignment" required min="0" max="100" step="0.1" value={predictorData.assignment} onChange={handlePredictorChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50" placeholder="e.g. 92.0" />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">/100</div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={predictLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400"
                        >
                            {predictLoading ? 'Analyzing Model...' : 'Predict Final Grade'}
                        </button>
                    </form>

                    <div className="bg-gray-50 border-t border-gray-100 p-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Model Result</p>
                        {prediction ? (
                            <div className="flex bg-white border border-indigo-100 rounded-lg p-4 shadow-sm items-center gap-4">
                                <div className={`h - 14 w - 14 rounded - full flex items - center justify - center font - black text - 2xl border - 4 ${prediction.predicted_grade === 'F' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'} `}>
                                    {prediction.predicted_grade}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 font-bold mb-0.5">Forest Target Locked</p>
                                    <p className="text-xs text-gray-500 font-medium">Network Confidence: <span className="text-indigo-600 font-bold">{prediction.confidence_percentage}%</span></p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-sm text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                                Awaiting Inputs...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Marks Modal (Teacher/Admin only) */}
            {isAddModalOpen && isTeacherOrAdmin && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setIsAddModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-800 opacity-75 backdrop-blur-sm"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8">
                            <h3 className="text-xl leading-6 font-bold text-gray-900 mb-6 border-b pb-4">Record New Marks</h3>
                            <form onSubmit={handleAddSubmit} className="space-y-5">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Target Student</label>
                                        <select name="student_id" required value={formData.student_id} onChange={handleFormChange} className="block w-full border border-gray-300 bg-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            <option value="" disabled>Select a student...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name})</option>)}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Area</label>
                                        <select name="subject_id" required value={formData.subject_id} onChange={handleFormChange} className="block w-full border border-gray-300 bg-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            <option value="" disabled>Select a subject...</option>
                                            {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mid Term (/100)</label>
                                        <input type="number" name="mid_term" required min="0" max="100" step="0.1" value={formData.mid_term} onChange={handleFormChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Final Term (/100)</label>
                                        <input type="number" name="final_term" required min="0" max="100" step="0.1" value={formData.final_term} onChange={handleFormChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50" />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Assignment (/100)</label>
                                        <input type="number" name="assignment" required min="0" max="100" step="0.1" value={formData.assignment} onChange={handleFormChange} className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50" />
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 sm:flex sm:flex-row-reverse gap-3">
                                    <button type="submit" disabled={actionLoading} className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm transition-colors ${actionLoading ? 'opacity-75 cursor-not-allowed' : ''}`}>
                                        {actionLoading ? 'Saving into DB...' : 'Commit Marks'}
                                    </button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Marks;
