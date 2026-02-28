import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout & Protection
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Marks from './pages/Marks';
import MLInsights from './pages/MLInsights';

const AppLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

// Internal router layout hack to render Navbar/Sidebar dynamically 
import { Outlet } from 'react-router-dom';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Routes encapsulated in Layout */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/marks" element={<Marks />} />

                            {/* Admin/Teacher Only */}
                            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                                <Route path="/students" element={<Students />} />
                                <Route path="/ml-insights" element={<MLInsights />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
