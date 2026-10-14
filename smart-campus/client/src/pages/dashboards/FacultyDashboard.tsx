import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MetricCard } from '../../components/MetricCard';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Users2,
  GraduationCap,
  Search,
  BookOpen,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [facultyProfile, setFacultyProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const facId = user?.facultyProfile?.id || 3; // Faculty ID for faculty.cse2

  useEffect(() => {
    async function loadFacultyData() {
      try {
        setLoading(true);
        const res = await api.getFaculty(facId);
        if (res.success && res.faculty) {
          setFacultyProfile(res.faculty);
          setStudents(res.faculty.students || []);
        }
      } catch (err) {
        console.error('Failed to load faculty mentor data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFacultyData();
  }, [facId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Loading faculty mentorship roster...</span>
        </div>
      </div>
    );
  }

  const assignedCount = students.length;
  const maxCapacity = facultyProfile?.maxCapacity || 35;
  const remainingCapacity = Math.max(0, maxCapacity - assignedCount);
  const utilization = maxCapacity > 0 ? Math.round((assignedCount / maxCapacity) * 100) : 0;

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Users2 className="w-3.5 h-3.5" />
            <span>Class Mentor Command Center</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            {facultyProfile?.user?.name || user?.name}
          </h1>
          <p className="mt-1 text-xs text-emerald-200">
            Faculty Code: <strong className="text-white font-mono">{facultyProfile?.facultyCode}</strong> •{' '}
            {facultyProfile?.designation} • {facultyProfile?.department?.name}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={assignedCount >= maxCapacity ? 'warning' : 'success'}>
            {assignedCount} / {maxCapacity} Assigned
          </Badge>
          <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-medium">
            {remainingCapacity} Slots Available
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Students"
          value={assignedCount}
          subtitle={`Under Direct Mentorship`}
          icon={GraduationCap}
          color="emerald"
        />
        <MetricCard
          title="Maximum Capacity"
          value={maxCapacity}
          subtitle="Target Limit per Mentor"
          icon={Users2}
          color="indigo"
        />
        <MetricCard
          title="Remaining Capacity"
          value={remainingCapacity}
          subtitle="Available for Allocation"
          icon={CheckCircle2}
          color={remainingCapacity > 0 ? 'blue' : 'amber'}
        />
        <MetricCard
          title="Workload Utilization"
          value={`${utilization}%`}
          subtitle="Capacity Consumption"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Assigned Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              My Assigned Students Roster ({assignedCount})
            </h3>
            <p className="text-xs text-slate-500">
              Students assigned exclusively to your mentorship cohort under departmental guidelines
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student ID, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            No students found matching your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="py-3 px-3">Student ID</th>
                  <th className="py-3 px-3">Full Name</th>
                  <th className="py-3 px-3">Academic Session</th>
                  <th className="py-3 px-3">Semester & Section</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {stu.studentId}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{stu.name}</p>
                      <p className="text-[11px] text-slate-400">{stu.email}</p>
                    </td>
                    <td className="py-2.5 px-3">{stu.academicYear}</td>
                    <td className="py-2.5 px-3">
                      Sem {stu.semester} ({stu.section})
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="success">{stu.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedStudent(stu)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Inspection Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Record: ${selectedStudent.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Student ID</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">
                  {selectedStudent.studentId}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Status</p>
                <Badge variant="success">{selectedStudent.status}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.email}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.phone || 'Not recorded'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Enrolled Program:</span>
                <span className="font-semibold text-slate-800">
                  {facultyProfile?.department?.name}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500">Academic Standing:</span>
                <span className="font-semibold text-slate-800">
                  Semester {selectedStudent.semester} (Section {selectedStudent.section})
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
