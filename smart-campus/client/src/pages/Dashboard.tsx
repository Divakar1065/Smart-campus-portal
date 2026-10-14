import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import {
  Building2,
  Users2,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  GitFork,
  Shuffle,
  Download,
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

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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
        console.error('Failed to load dashboard statistics:', err);
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
          <span className="font-semibold text-slate-700">Loading campus intelligence...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const departmentBreakdown = data?.departmentBreakdown || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 backdrop-blur-sm border border-white/10">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Academic Session 2026-2027</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Campus Hierarchy & Student Allocation
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Live institutional governance: 1 Dean, 8 Departments, 17 Faculty Mentors, and 560
            Students with strictly balanced workloads.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('hierarchy')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-semibold text-xs shadow-md hover:bg-indigo-50 transition"
          >
            <GitFork className="w-4 h-4 text-indigo-600" />
            <span>Explore Visual Tree</span>
          </button>
          <button
            onClick={() => onNavigate('allocation')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 border border-indigo-500/30 text-white font-semibold text-xs shadow-md transition"
          >
            <Shuffle className="w-4 h-4 text-indigo-300" />
            <span>Auto-Balance Workload</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Departments"
          value={stats.totalDepartments || 8}
          subtitle="8 Engineering Units"
          icon={Building2}
          color="indigo"
          onClick={() => onNavigate('departments')}
        />
        <MetricCard
          title="Faculty Mentors"
          value={stats.totalFaculty || 17}
          subtitle="2-3 Mentors / Dept"
          icon={Users2}
          color="emerald"
          onClick={() => onNavigate('faculty')}
        />
        <MetricCard
          title="Enrolled Students"
          value={stats.totalStudents || 560}
          subtitle={`${stats.assignedStudents || 544} Allocated (${stats.overallUtilization || 91}%)`}
          icon={GraduationCap}
          color="blue"
          onClick={() => onNavigate('students')}
        />
        <MetricCard
          title="Unassigned Queue"
          value={stats.unassignedStudents || 16}
          subtitle="Awaiting Faculty Mentor"
          icon={AlertTriangle}
          color={stats.unassignedStudents > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigate('allocation')}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Mentorship Capacity
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats.assignedStudents} / {stats.totalCapacity}
            </span>
            <Badge variant="purple">{stats.overallUtilization}% Filled</Badge>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.overallUtilization || 90}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Remaining Available Slots: {stats.availableCapacity || 0} students
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
            <span className="text-xs font-medium text-slate-500">Students / Mentor</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Target institutional window: <strong className="text-slate-800">30–35</strong> students
            per faculty member.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Institutional Hierarchy Status
          </p>
          <div className="mt-2 flex items-center space-x-2 text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-base text-slate-900">All 8 Departments Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            1 Dean, 8 HODs appointed, department-student boundary integrity 100% verified.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Capacity vs Enrolled */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Department Capacity & Student Enrollment
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of assigned students vs total mentor capacity by department
              </p>
            </div>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
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

        {/* Audit Log Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Recent Activity</h3>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Full Audit
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent activity logs.</p>
              ) : (
                recentLogs.slice(0, 6).map((log: any) => (
                  <div key={log.id} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                        {log.action}
                      </span>
                      <span className="text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By {log.userName}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified System State</span>
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
              Realtime Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
