import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';

// Super Admin
import SuperDashboard from './pages/super_admin/SuperDashboard';
import { ManageSchools, ManageAdmins } from './pages/super_admin/SuperAdminPages';

// School Admin
import SchoolDashboard from './pages/school_admin/SchoolDashboard';
import { ManageTeachers, SchoolReports } from './pages/school_admin/SchoolAdminPages';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import { MyStudents, AddMarks, MLInsights } from './pages/teacher/TeacherPages';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import { MyReport } from './pages/student/StudentPages';

const AppLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 uppercase-tracking-widest">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* All Protected Routes under AppLayout */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>

                            {/* Root redirect to specific dashboard */}
                            <Route index element={<Navigate to="/login" replace />} />

                            {/* Super Admin Routes */}
                            <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
                                <Route path="/super-admin/dashboard" element={<SuperDashboard />} />
                                <Route path="/super-admin/manage-schools" element={<ManageSchools />} />
                                <Route path="/super-admin/manage-admins" element={<ManageAdmins />} />
                            </Route>

                            {/* School Admin Routes */}
                            <Route element={<RoleRoute allowedRoles={['school_admin']} />}>
                                <Route path="/school-admin/dashboard" element={<SchoolDashboard />} />
                                <Route path="/school-admin/manage-teachers" element={<ManageTeachers />} />
                                <Route path="/school-admin/reports" element={<SchoolReports />} />
                            </Route>

                            {/* Teacher Routes */}
                            <Route element={<RoleRoute allowedRoles={['teacher']} />}>
                                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                                <Route path="/teacher/my-students" element={<MyStudents />} />
                                <Route path="/teacher/add-marks" element={<AddMarks />} />
                                <Route path="/teacher/ml-insights" element={<MLInsights />} />
                            </Route>

                            {/* Student Routes */}
                            <Route element={<RoleRoute allowedRoles={['student']} />}>
                                <Route path="/student/dashboard" element={<StudentDashboard />} />
                                <Route path="/student/my-report" element={<MyReport />} />
                            </Route>

                        </Route>
                    </Route>

                    {/* Catch-all redirect to login (auth context will handle already-logged-in redirection) */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
