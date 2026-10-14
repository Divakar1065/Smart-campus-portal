import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { DeanDashboard } from './pages/dashboards/DeanDashboard';
import { HodDashboard } from './pages/dashboards/HodDashboard';
import { FacultyDashboard } from './pages/dashboards/FacultyDashboard';
import { StudentPortal } from './pages/dashboards/StudentPortal';
import { Hierarchy } from './pages/Hierarchy';
import { Departments } from './pages/Departments';
import { Faculty } from './pages/Faculty';
import { Students } from './pages/Students';
import { Allocation } from './pages/Allocation';
import { Reports } from './pages/Reports';

const MainLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Reset tab on role switch
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600 font-semibold">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-800 text-sm">Authenticating Smart Campus session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Render Role-Based Primary Dashboard
  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard onNavigate={setCurrentTab} />;
      case 'DEAN':
        return <DeanDashboard onNavigate={setCurrentTab} />;
      case 'HOD':
        return <HodDashboard onNavigate={setCurrentTab} />;
      case 'FACULTY':
        return <FacultyDashboard />;
      case 'STUDENT':
        return <StudentPortal />;
      default:
        return <DeanDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans antialiased text-slate-800">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && renderDashboardByRole()}
          {currentTab === 'hierarchy' && <Hierarchy />}
          {currentTab === 'departments' && <Departments />}
          {currentTab === 'faculty' && <Faculty />}
          {currentTab === 'students' && (
            user?.role === 'FACULTY' ? <FacultyDashboard /> : <Students />
          )}
          {currentTab === 'allocation' && <Allocation />}
          {currentTab === 'reports' && <Reports />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
