import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import {
  Building2,
  Users2,
  GraduationCap,
  Shuffle,
  FileBarChart2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';

interface HodDashboardProps {
  onNavigate: (tab: string) => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [department, setDepartment] = useState<any>(null);
  const [deptFaculty, setDeptFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const deptId = user?.departmentId || 3; // Default to CSE (id 3) if not set

  useEffect(() => {
    async function loadHodData() {
      try {
        setLoading(true);
        const [deptRes, facRes] = await Promise.all([
          api.getDepartment(deptId),
          api.getFacultyList({ departmentId: deptId }),
        ]);

        if (deptRes.success) setDepartment(deptRes.department);
        if (facRes.success) setDeptFaculty(facRes.faculty);
      } catch (err) {
        console.error('Failed to load HOD departmental data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHodData();
  }, [deptId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Loading department command center...</span>
        </div>
      </div>
    );
  }

  const assignedCount = department?.totalAssigned || 0;
  const totalStudents = department?.studentCount || 0;
  const unassignedCount = department?.unassignedStudents || 0;
  const totalCapacity = department?.totalCapacity || 0;
  const utilization = department?.capacityUtilization || 0;

  return (
    <div className="space-y-6">
      {/* HOD Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Building2 className="w-3.5 h-3.5" />
            <span>Head of Department — {department?.code}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            {department?.name}
          </h1>
          <p className="mt-1 text-xs text-blue-200">
            HOD: <strong className="text-white">{user?.name}</strong> • {user?.email} • Institutional Scope: Departmental Only
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('allocation')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md hover:bg-slate-50 transition"
          >
            <Shuffle className="w-4 h-4 text-indigo-600" />
            <span>Student Allocation</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
          >
            <FileBarChart2 className="w-4 h-4 text-indigo-200" />
            <span>Department Reports</span>
          </button>
        </div>
      </div>

      {/* Department KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Faculty Members"
          value={deptFaculty.length}
          subtitle={`Under ${department?.code} Management`}
          icon={Users2}
          color="emerald"
          onClick={() => onNavigate('faculty')}
        />
        <MetricCard
          title="Total Students"
          value={totalStudents}
          subtitle={`${assignedCount} Mentored`}
          icon={GraduationCap}
          color="blue"
          onClick={() => onNavigate('students')}
        />
        <MetricCard
          title="Unassigned Queue"
          value={unassignedCount}
          subtitle="Awaiting Faculty Mentor"
          icon={AlertTriangle}
          color={unassignedCount > 0 ? 'amber' : 'emerald'}
          onClick={() => onNavigate('allocation')}
        />
        <MetricCard
          title="Capacity Utilization"
          value={`${utilization}%`}
          subtitle={`${assignedCount} / ${totalCapacity} Maximum`}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* Faculty Workload Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Department Faculty Mentorship Workload
            </h3>
            <p className="text-xs text-slate-500">
              Live capacity monitoring for {department?.code} faculty members (Target: 30–35 students)
            </p>
          </div>
          <button
            onClick={() => onNavigate('faculty')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>Faculty Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptFaculty.map((fac) => {
            const isFull = fac.assignedCount >= fac.maxCapacity;
            const utilizationColor =
              fac.utilization >= 100
                ? 'bg-rose-500'
                : fac.utilization >= 85
                ? 'bg-indigo-600'
                : 'bg-emerald-500';

            return (
              <div
                key={fac.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                        {fac.facultyCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{fac.name}</h4>
                      <p className="text-xs text-slate-500">{fac.designation}</p>
                    </div>
                    <Badge variant={isFull ? 'warning' : 'success'}>
                      {fac.assignedCount} / {fac.maxCapacity}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Workload Gauge</span>
                      <span className="font-bold text-slate-700">{fac.utilization}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${utilizationColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, fac.utilization)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Available Seats:</span>
                  <span className="font-bold text-slate-800">{fac.availableCapacity} slots</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
