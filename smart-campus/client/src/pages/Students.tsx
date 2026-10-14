import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Department, Faculty } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  // Add Form
  const [addForm, setAddForm] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    academicYear: '2024-2028',
    semester: 4,
    section: 'A',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stuRes, deptRes, facRes] = await Promise.all([
        api.getStudents({
          page,
          limit,
          departmentId: selectedDeptId !== 'ALL' ? selectedDeptId : undefined,
          assignmentStatus: assignmentFilter !== 'ALL' ? assignmentFilter : undefined,
          search: search || undefined,
        }),
        api.getDepartments(),
        api.getFacultyList(),
      ]);

      if (stuRes.success) {
        setStudents(stuRes.students);
        setTotalPages(stuRes.pagination.totalPages);
        setTotalStudents(stuRes.pagination.total);
      }
      if (deptRes.success) setDepartments(deptRes.departments);
      if (facRes.success) setFacultyList(facRes.faculty);
    } catch (err) {
      console.error('Failed to load students roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, limit, selectedDeptId, assignmentFilter, search]);

  const handleQuickAssign = async (studentId: number, facultyIdStr: string) => {
    const facultyId = facultyIdStr === '' ? null : Number(facultyIdStr);
    try {
      await api.allocateSingle(studentId, facultyId);
      loadData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    const q = new URLSearchParams();
    if (selectedDeptId !== 'ALL') q.append('departmentId', String(selectedDeptId));
    if (assignmentFilter !== 'ALL') q.append('assignmentStatus', assignmentFilter);
    window.open(`/api/students/export/csv?${q.toString()}`, '_blank');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const res = await api.importStudentsCsv(csvText);
      if (res.success) {
        setImportResult(res);
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Import failed');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const res = await api.createStudent({
        ...addForm,
        departmentId: Number(addForm.departmentId),
        semester: Number(addForm.semester),
      });
      if (res.success) {
        setIsAddModalOpen(false);
        setAddForm({
          studentId: '',
          name: '',
          email: '',
          phone: '',
          departmentId: '',
          academicYear: '2024-2028',
          semester: 4,
          section: 'A',
        });
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Student Roster ({totalStudents} Enrolled)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete institutional student body with departmental affiliation and faculty mentor
            assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setImportResult(null);
              setCsvText('');
              setIsImportModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Allocation Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={assignmentFilter}
              onChange={(e) => {
                setAssignmentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="ALL">All Mentorship Status</option>
              <option value="ASSIGNED">Allocated Mentors Only</option>
              <option value="UNASSIGNED">Unassigned Students Only</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student ID, name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading students roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No students match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Faculty Mentor</th>
                  <th className="py-3 px-4">Academic Level</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Mentor Assign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const deptFaculty = facultyList.filter(
                    (f) => f.departmentId === student.departmentId
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {student.studentId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-[11px] text-slate-400">{student.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {student.departmentCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {student.facultyName ? (
                          <div>
                            <p className="font-bold text-indigo-700">{student.facultyName}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {student.facultyCode}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="warning">Unassigned</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700">
                          Sem {student.semester} • Sec {student.section}
                        </p>
                        <p className="text-[10px] text-slate-400">{student.academicYear}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={student.isAssigned ? 'success' : 'warning'}>
                          {student.isAssigned ? 'MENTORED' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={student.facultyId || ''}
                          onChange={(e) => handleQuickAssign(student.id, e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">(None / Unassigned)</option>
                          {deptFaculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.assignedCount}/{f.maxCapacity})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span>
              Showing {students.length} of {totalStudents} records
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Enroll New Student">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student ID
              </label>
              <input
                type="text"
                placeholder="e.g. CSE2026561"
                value={addForm.studentId}
                onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alexander Clark"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="student@college.edu"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={addForm.departmentId}
                onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={addForm.academicYear}
                onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Semester
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={addForm.semester}
                onChange={(e) => setAddForm({ ...addForm, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Section
              </label>
              <input
                type="text"
                value={addForm.section}
                onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Students CSV">
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          {importResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              <p className="font-bold">
                Successfully imported {importResult.importedCount} student records!
              </p>
              {importResult.skippedCount > 0 && (
                <p className="text-[11px] mt-1">
                  Skipped / Errors: {importResult.skippedCount}
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">CSV Column Format (with Header):</p>
            <code className="text-[11px] bg-white p-1 rounded border border-slate-200 block overflow-x-auto font-mono">
              studentId,name,email,phone,departmentCode,academicYear,semester,section
            </code>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Paste CSV Content Here:
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="studentId,name,email,phone,departmentCode,academicYear,semester,section&#10;CSE2026570,John Doe,john.doe@college.edu,555-1234,CSE,2024-2028,4,A"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Execute CSV Import
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
