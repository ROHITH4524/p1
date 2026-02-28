import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const MyReport = () => {
    const { user } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            // Reusing the same data structure planned for the PDF endpoint
            const res = await api.get('/api/student/my-report-pdf');
            setReport(res.data);
        } catch (err) {
            console.error("Failed to fetch report", err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPDF = () => {
        if (!report) return;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("ACADEMIC PROGRESS REPORT", 105, 25, { align: 'center' });

        // Student Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Student Name: ${report.student_name}`, 14, 50);
        doc.text(`Class: ${report.class}`, 14, 57);
        doc.text(`School: ${report.school_name}`, 14, 64);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50);

        // Table
        const tableColumn = ["Subject", "Mid Term", "Final Term", "Assignment", "Total", "Grade"];
        const tableRows = report.subjects.map(s => [
            s.subject_name, s.mid_term, s.final_term, s.assignment, s.total, s.grade
        ]);

        doc.autoTable({
            startY: 75,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Summary
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.text(`Performance Tier: ${report.performance_tier}`, 14, finalY);
        doc.text(`Overall Recommendation: ${report.performance_tier === 'High' ? 'Excellent Work!' : 'Keep Improving!'}`, 14, finalY + 10);

        doc.save(`${report.student_name}_Report.pdf`);
    };

    if (isLoading) return <div className="p-8 text-blue-600 font-bold animate-pulse">Generating Report Card...</div>;
    if (!report) return <div className="p-8 text-red-600">Failed to load report data.</div>;

    return (
        <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">Academic Report Card</h1>
                    <p className="text-blue-600/60 font-medium">Official session record for {new Date().getFullYear()}</p>
                </div>
                <button
                    onClick={downloadPDF}
                    className="px-8 py-4 bg-black text-white font-black rounded-2xl shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download PDF
                </button>
            </div>

            {/* Visual Report Card */}
            <div className="bg-white rounded-[3rem] shadow-2xl border border-blue-50 overflow-hidden max-w-5xl mx-auto shadow-blue-100/50">
                <div className="bg-blue-600 p-12 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-widest">{report.school_name}</h2>
                        <p className="mt-2 text-blue-100/60 font-bold">Official Transcript</p>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Student ID</p>
                        <p className="text-2xl font-black">#STU-{user?.id || '000'}</p>
                    </div>
                </div>

                <div className="p-12 space-y-12">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-gray-100">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student Name</p>
                            <p className="text-xl font-bold text-blue-900">{report.student_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Class/Grade</p>
                            <p className="text-xl font-bold text-blue-900">{report.class}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Performance Status</p>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${report.performance_tier === 'High' ? 'bg-emerald-500 text-white' :
                                    report.performance_tier === 'Medium' ? 'bg-indigo-500 text-white' :
                                        'bg-orange-500 text-white'
                                }`}>{report.performance_tier} Tier</span>
                        </div>
                    </div>

                    {/* Report Table */}
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-50">
                                <th className="pb-4">Subject</th>
                                <th className="pb-4 text-center">Mid Term</th>
                                <th className="pb-4 text-center">Final Term</th>
                                <th className="pb-4 text-center">Assignment</th>
                                <th className="pb-4 text-center">Total</th>
                                <th className="pb-4 text-right">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {report.subjects.map((sub, idx) => (
                                <tr key={idx} className="group">
                                    <td className="py-6 font-bold text-blue-900 group-hover:text-blue-600 transition-colors">{sub.subject_name}</td>
                                    <td className="py-6 text-center text-gray-500 font-medium">{sub.mid_term}</td>
                                    <td className="py-6 text-center text-gray-500 font-medium">{sub.final_term}</td>
                                    <td className="py-6 text-center text-gray-500 font-medium">{sub.assignment}</td>
                                    <td className="py-6 text-center font-black text-blue-900">{sub.total}</td>
                                    <td className="py-6 text-right">
                                        <span className={`px-4 py-1.5 rounded-xl font-black text-xs ${sub.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-600' :
                                                sub.grade === 'B' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-orange-50 text-orange-600'
                                            }`}>{sub.grade}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Signature */}
                    <div className="pt-12 border-t border-gray-100 flex justify-between items-center opacity-40 grayscale">
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-gray-900 mb-2"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Class Teacher Signature</p>
                        </div>
                        <div className="text-center italic font-serif text-2xl text-blue-900 transform -rotate-12">
                            eduFlow Certified
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-gray-900 mb-2"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Principal Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
