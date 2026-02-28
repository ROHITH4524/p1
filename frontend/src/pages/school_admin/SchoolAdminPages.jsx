import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageShell from '../PageShell';
import ManageTeachers from './ManageTeachers';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export { ManageTeachers };

export const SchoolReports = () => {
    const [report, setReport] = useState([]);
    const [filters, setFilters] = useState({ teacher: '', class: '', subject: '', grade: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await api.get('/api/school-admin/reports');
            setReport(res.data);
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = report.filter(row => {
        return (filters.teacher === '' || row.teacher.toLowerCase().includes(filters.teacher.toLowerCase())) &&
            (filters.class === '' || row.class_name.toLowerCase().includes(filters.class.toLowerCase())) &&
            (filters.subject === '' || row.subject.toLowerCase().includes(filters.subject.toLowerCase())) &&
            (filters.grade === '' || row.grade === filters.grade);
    });

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("School Academic Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Student", "Class", "Subject", "Mid", "Final", "Assign", "Total", "Grade", "Teacher"];
        const tableRows = filteredData.map(row => [
            row.student,
            row.class_name,
            row.subject,
            row.mid_term,
            row.final_term,
            row.assignment,
            row.total,
            row.grade,
            row.teacher
        ]);

        doc.autoTable({
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save("school_report.pdf");
    };

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Loading School Reports...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Academic Reports</h1>
                    <p className="text-blue-600/60 font-medium tracking-wide uppercase text-xs mt-1">Full School Performance Matrix</p>
                </div>
                <button
                    onClick={exportPDF}
                    className="px-6 py-3 bg-blue-900 text-white font-bold rounded-xl shadow-lg hover:bg-black active:scale-95 transition-all flex items-center gap-2"
                >
                    📥 Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-50 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text" placeholder="Filter Teacher..."
                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all"
                    value={filters.teacher} onChange={e => setFilters({ ...filters, teacher: e.target.value })}
                />
                <input
                    type="text" placeholder="Filter Class..."
                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all"
                    value={filters.class} onChange={e => setFilters({ ...filters, class: e.target.value })}
                />
                <input
                    type="text" placeholder="Filter Subject..."
                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all"
                    value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}
                />
                <select
                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm transition-all"
                    value={filters.grade} onChange={e => setFilters({ ...filters, grade: e.target.value })}
                >
                    <option value="">All Grades</option>
                    {['A+', 'A', 'B', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 border-b border-blue-50">
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap">Student</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap">Class</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap">Subject</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-center">Mid</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-center">Final</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-center">Assign</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-center">Total</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-center">Grade</th>
                                <th className="px-6 py-4 text-xs font-black text-blue-900 uppercase tracking-widest whitespace-nowrap text-right">Teacher</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-50/50">
                            {filteredData.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/10 transition-colors">
                                    <td className="px-6 py-4 font-bold text-blue-900">{row.student}</td>
                                    <td className="px-6 py-4 text-xs font-black text-blue-400">{row.class_name}</td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{row.subject}</td>
                                    <td className="px-6 py-4 text-center text-sm">{row.mid_term}</td>
                                    <td className="px-6 py-4 text-center text-sm">{row.final_term}</td>
                                    <td className="px-6 py-4 text-center text-sm">{row.assignment}</td>
                                    <td className="px-6 py-4 text-center font-black text-blue-900">{row.total}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${row.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                                row.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                    row.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                            }`}>{row.grade}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-[10px] font-black uppercase text-blue-400">{row.teacher}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
