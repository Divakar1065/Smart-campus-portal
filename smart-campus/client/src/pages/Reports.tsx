import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  FileBarChart2,
  Printer,
  Download,
  Users2,
  Building2,
  AlertTriangle,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEPT' | 'WORKLOAD' | 'UNASSIGNED' | 'AUDIT'>('DEPT');
  const [deptData, setDeptData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [unassignedData, setUnassignedData] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [deptRes, workRes, unRes, auditRes] = await Promise.all([
          api.getDepartmentReport(),
          api.getWorkloadReport(),
          api.getUnassignedReport(),
          api.getAuditLogs(),
        ]);

        if (deptRes.success) setDeptData(deptRes.report);
        if (workRes.success) setWorkloadData(workRes.report);
        if (unRes.success) setUnassignedData(unRes.students);
        if (auditRes.success) setAuditData(auditRes.logs);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExportCurrent = () => {
    let csvContent = '';
    let filename = 'smart-campus-report.csv';

    if (activeTab === 'DEPT') {
      filename = 'department-summary-report.csv';
      const headers = ['Code', 'Department Name', 'HOD Name', 'Faculty Count', 'Students Enrolled', 'Utilization Rate'];
      const rows = deptData.map((d) => [
        d.code,
        `"${d.name}"`,
        `"${d.hodName}"`,
        d.facultyCount,
        d.studentCount,
        d.utilizationRate,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeTab === 'WORKLOAD') {
      filename = 'faculty-workload-report.csv';
      const headers = ['Faculty Code', 'Name', 'Department', 'Designation', 'Assigned Students', 'Capacity', 'Utilization', 'Status'];
      const rows = workloadData.map((w) => [
        w.facultyCode,
        `"${w.name}"`,
        w.departmentCode,
        `"${w.designation}"`,
        w.assignedStudents,
        w.maxCapacity,
        w.utilizationPercentage,
        w.statusLabel,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (activeTab === 'UNASSIGNED') {
      filename = 'unassigned-students-report.csv';
      const headers = ['Student ID', 'Name', 'Email', 'Department', 'Academic Year', 'Semester'];
      const rows = unassignedData.map((u) => [
        u.studentId,
        `"${u.name}"`,
        u.email,
        u.departmentCode,
        u.academicYear,
        u.semester,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      filename = 'system-audit-log.csv';
      const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Details'];
      const rows = auditData.map((a) => [
        a.createdAt,
        `"${a.userName}"`,
        a.action,
        a.entity,
        `"${(a.details || '').replace(/"/g, '""')}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileBarChart2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Institutional Reports & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional summaries, mentor workload equity, and governance audit records
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCurrent}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('DEPT')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'DEPT'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Summary (8)</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKLOAD')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'WORKLOAD'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Faculty Workload Equity (17)</span>
        </button>

        <button
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'UNASSIGNED'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Unassigned Students ({unassignedData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'AUDIT'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail ({auditData.length})</span>
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Generating report...</div>
        ) : activeTab === 'DEPT' ? (
          /* ================= DEPT SUMMARY REPORT ================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">HOD</th>
                  <th className="py-3 px-4 text-center">Faculty</th>
                  <th className="py-3 px-4 text-center">Students</th>
                  <th className="py-3 px-4 text-center">Mentor Ratio</th>
                  <th className="py-3 px-4 text-center">Capacity Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3 px-4 text-slate-700">{d.hodName}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {d.facultyCount}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {d.assignedCount} / {d.studentCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-indigo-700">
                      {d.facultyRatio}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={d.unassignedCount > 0 ? 'warning' : 'success'}>
                        {d.utilizationRate}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'WORKLOAD' ? (
          /* ================= WORKLOAD REPORT ================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Mentor Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Assigned Students</th>
                  <th className="py-3 px-4 text-center">Capacity</th>
                  <th className="py-3 px-4 text-center">Workload %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloadData.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {w.facultyCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{w.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{w.departmentCode}</td>
                    <td className="py-3 px-4 text-slate-500">{w.designation}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {w.assignedStudents}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">{w.maxCapacity}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">
                      {w.utilizationPercentage}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          w.statusLabel === 'Optimal'
                            ? 'success'
                            : w.statusLabel === 'At Capacity'
                            ? 'purple'
                            : 'warning'
                        }
                      >
                        {w.statusLabel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'UNASSIGNED' ? (
          /* ================= UNASSIGNED STUDENTS ================= */
          <div className="overflow-x-auto">
            {unassignedData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                All students campus-wide have been assigned to faculty mentors!
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Academic Year</th>
                    <th className="py-3 px-4">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unassignedData.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {u.studentId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {u.departmentCode}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{u.academicYear}</td>
                      <td className="py-3 px-4 text-slate-700">
                        Sem {u.semester} ({u.section})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* ================= AUDIT LOGS ================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditData.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.userName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{a.entity}</td>
                    <td className="py-3 px-4 text-slate-600">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
