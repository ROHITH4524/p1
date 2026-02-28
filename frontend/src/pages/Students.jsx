import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Students = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';
    const isTeacherOrAdmin = ['admin', 'teacher'].includes(user?.role);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'M', class_name: '', email: '', password: ''
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/students/all');
            setStudents(res.data);
        } catch (err) {
            setError("Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => setSearchTerm(e.target.value);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.class_name && s.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openAddModal = () => {
        setFormData({ name: '', age: '', gender: 'M', class_name: '', email: '', password: '' });
        setIsAddModalOpen(true);
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setFormData({
            name: student.name, age: student.age, gender: student.gender, class_name: student.class_name
        });
        setIsEditModalOpen(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/api/students/add', {
                ...formData,
                age: parseInt(formData.age),
                class_name: formData.class_name || 'Unassigned' // Ensure default for DB
            }, {
                // Adjust payload structurally to match your FastAPI Pydantic schema explicitly
                transformRequest: [(data) => JSON.stringify({
                    name: data.name,
                    age: data.age,
                    gender: data.gender,
                    class_: data.class_name,
                    email: data.email,
                    password: data.password
                })],
                headers: { 'Content-Type': 'application/json' }
            });
            setIsAddModalOpen(false);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.detail || "Error adding student");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.put(`/api/students/${selectedStudent.id}`, {
                name: formData.name,
                age: parseInt(formData.age),
                gender: formData.gender,
                class_: formData.class_name
            });
            setIsEditModalOpen(false);
            fetchStudents();
        } catch (err) {
            alert("Error updating student");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/api/students/${id}`);
                fetchStudents();
            } catch (err) {
                alert("Error deleting student");
            }
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) return alert("Please select a file first");

        const formData = new FormData();
        formData.append("file", csvFile);

        setActionLoading(true);
        try {
            const res = await api.post('/api/students/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Success! Imported ${res.data.imported_count} students.`);
            setIsUploadModalOpen(false);
            setCsvFile(null);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.detail || "Error uploading CSV");
        } finally {
            setActionLoading(false);
        }
    };

    if (!isTeacherOrAdmin) return <div className="p-6">Access Denied</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-500 text-sm">View, search, and manage student records.</p>
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Upload CSV
                        </button>
                        <button
                            onClick={openAddModal}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Add Student
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or class..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            Loading student data...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No students found matching your search.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Demographics</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.user_email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Class {student.class_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.age} yrs • {student.gender}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(student)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(student.id, student.name)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setIsAddModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">Add New Student</h3>
                            <form onSubmit={handleAddSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Class</label>
                                        <input type="text" name="class_name" required value={formData.class_name} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Age</label>
                                        <input type="number" name="age" required min="1" value={formData.age} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleFormChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Student Login Email</label>
                                        <input type="email" name="email" required value={formData.email} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Student Login Password</label>
                                        <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="At least 8 characters" />
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" disabled={actionLoading} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${actionLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm`}>
                                        {actionLoading ? 'Saving...' : 'Save Student'}
                                    </button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {isEditModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setIsEditModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">Edit Student Details</h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Class</label>
                                        <input type="text" name="class_name" required value={formData.class_name} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Age</label>
                                        <input type="number" name="age" required min="1" value={formData.age} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleFormChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" disabled={actionLoading} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${actionLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm`}>
                                        {actionLoading ? 'Updating...' : 'Update Details'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CSV Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setIsUploadModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2">Upload Students Template (CSV)</h3>
                            <p className="text-sm text-gray-500 mb-4">Upload a .csv file containing columns: <code className="bg-gray-100 px-1 rounded">name, age, gender, class, email, password</code>.</p>

                            <form onSubmit={handleFileUpload} className="mt-2">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-blue-400 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-gray-500">{csvFile ? csvFile.name : 'CSV files only'}</p>
                                        </div>
                                        <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files[0])} />
                                    </label>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" disabled={actionLoading || !csvFile} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${actionLoading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}>
                                        {actionLoading ? 'Importing...' : 'Start Import'}
                                    </button>
                                    <button type="button" onClick={() => { setIsUploadModalOpen(false); setCsvFile(null) }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm">
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

export default Students;
