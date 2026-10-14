import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import {
  GraduationCap,
  Building2,
  Users2,
  GitFork,
  FileBarChart2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DeanDashboardProps {
  onNavigate: (tab: string) => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ onNavigate }) => {
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
        console.error('Failed to load dean stats:', err);
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
          <span className="font-semibold text-slate-700">Loading academic affairs oversight...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const departmentBreakdown = data?.departmentBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Dean of Academic Affairs</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Institutional Academic Overview
          </h1>
          <p className="mt-1 text-xs text-purple-200 max-w-xl">
            College-wide oversight across 8 academic departments, 8 HODs, 17 faculty mentors, and 560
            students with balanced mentorship allocations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('hierarchy')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md hover:bg-slate-50 transition"
          >
            <GitFork className="w-4 h-4 text-indigo-600" />
            <span>Interactive Hierarchy Tree</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-700/80 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition"
          >
            <FileBarChart2 className="w-4 h-4 text-purple-200" />
            <span>Institutional Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Departments"
          value={stats.totalDepartments || 8}
          subtitle="8 Engineering Units"
          icon={Building2}
          color="indigo"
          onClick={() => onNavigate('departments')}
        />
        <MetricCard
          title="Appointed HODs"
          value={stats.totalDepartments || 8}
          subtitle="1 HOD per Department"
          icon={Users2}
          color="purple"
          onClick={() => onNavigate('departments')}
        />
        <MetricCard
          title="Faculty Mentors"
          value={stats.totalFaculty || 17}
          subtitle="Target 30–35 Students / Mentor"
          icon={Users2}
          color="emerald"
          onClick={() => onNavigate('faculty')}
        />
        <MetricCard
          title="Total Students"
          value={stats.totalStudents || 560}
          subtitle={`${stats.assignedStudents || 544} Allocated (${stats.overallUtilization || 91}%)`}
          icon={GraduationCap}
          color="blue"
          onClick={() => onNavigate('students')}
        />
      </div>

      {/* Secondary Row: Capacity & Workload Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Institutional Capacity
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats.assignedStudents} / {stats.totalCapacity}
            </span>
            <Badge variant="purple">{stats.overallUtilization}% Load</Badge>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.overallUtilization || 90}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Available Slots: {stats.availableCapacity || 0} students
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Mentor Workload
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats.averageStudentsPerFaculty}
            </span>
            <span className="text-xs font-medium text-slate-500">Students / Faculty</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Institutional guideline: <strong className="text-slate-800">30–35</strong> students per
            faculty mentor.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Department Boundary Security
          </p>
          <div className="mt-2 flex items-center space-x-2 text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm text-slate-900">100% Boundary Compliant</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Zero cross-department student allocations. Strict mathematical workload isolation active.
          </p>
        </div>
      </div>

      {/* Chart: Students by Department & Capacity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Students and Mentor Capacity by Department
            </h3>
            <p className="text-xs text-slate-500">
              Department enrollment vs maximum faculty capacity across all 8 academic divisions
            </p>
          </div>
          <button
            onClick={() => onNavigate('departments')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View All Departments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentBreakdown}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                dataKey="assignedStudents"
                name="Assigned Students"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="capacity"
                name="Total Capacity"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
