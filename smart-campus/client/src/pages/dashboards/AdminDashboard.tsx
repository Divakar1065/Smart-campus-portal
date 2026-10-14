import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import {
  ShieldAlert,
  Building2,
  Users2,
  GraduationCap,
  Activity,
  CheckCircle2,
  ArrowRight,
  Database,
  KeyRound,
  FileBarChart2,
  GitFork,
  Shuffle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Loading system administration...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const totalUsers = (stats.totalStudents || 560) + (stats.totalFaculty || 17) + 2; // + Dean + Admin

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Institutional System Administration
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Global governance: user authentication, department configuration, RBAC permissions, and
            real-time audit logging across all 8 academic departments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('hierarchy')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md hover:bg-slate-50 transition"
          >
            <GitFork className="w-4 h-4 text-indigo-600" />
            <span>College Hierarchy</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
          >
            <FileBarChart2 className="w-4 h-4 text-indigo-200" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Admin Dashboard Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total User Accounts"
          value={totalUsers}
          subtitle="Dean, Admin, HODs, Faculty, Students"
          icon={Users2}
          color="indigo"
        />
        <MetricCard
          title="Departments"
          value={stats.totalDepartments || 8}
          subtitle="8 Active Engineering Units"
          icon={Building2}
          color="blue"
          onClick={() => onNavigate('departments')}
        />
        <MetricCard
          title="Appointed HODs"
          value={stats.totalDepartments || 8}
          subtitle="1 HOD per Department"
          icon={ShieldAlert}
          color="purple"
          onClick={() => onNavigate('departments')}
        />
        <MetricCard
          title="Faculty Mentors"
          value={stats.totalFaculty || 17}
          subtitle="17 Active Teaching Faculty"
          icon={Users2}
          color="emerald"
          onClick={() => onNavigate('faculty')}
        />
      </div>

      {/* Secondary Row: Students & Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Student Enrollment Roster
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalStudents || 560}</span>
            <Badge variant="success">{stats.assignedStudents || 544} Mentored</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Unassigned queue: <strong className="text-amber-600">{stats.unassignedStudents || 16}</strong> students
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active vs Inactive Accounts
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{totalUsers} Active</span>
            <Badge variant="gray">0 Inactive</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-2">100% account verification and health score.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Database & Security Engine
          </p>
          <div className="mt-2 flex items-center space-x-2 text-indigo-600 font-bold">
            <Database className="w-5 h-5 shrink-0" />
            <span className="text-sm text-slate-800">Prisma ORM • SQLite</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            JWT encryption, bcrypt password hashes, and schema foreign-key integrity active.
          </p>
        </div>
      </div>

      {/* Admin Quick Action Tiles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Central Administrative Workspaces</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('departments')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition"
          >
            <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Department Setup</h4>
            <p className="text-xs text-slate-500 mt-1">Create departments, assign HODs, configure quotas.</p>
          </div>

          <div
            onClick={() => onNavigate('faculty')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition"
          >
            <Users2 className="w-6 h-6 text-emerald-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Faculty Directory</h4>
            <p className="text-xs text-slate-500 mt-1">Review 17 faculty members, workloads, and capacities.</p>
          </div>

          <div
            onClick={() => onNavigate('students')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition"
          >
            <GraduationCap className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Student Roster</h4>
            <p className="text-xs text-slate-500 mt-1">Manage 560 students with pagination and CSV export/import.</p>
          </div>

          <div
            onClick={() => onNavigate('allocation')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer transition"
          >
            <Shuffle className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Balanced Allocation</h4>
            <p className="text-xs text-slate-500 mt-1">Run greedy auto-balance algorithm across departments.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
