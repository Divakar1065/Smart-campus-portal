import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Faculty as FacultyType, Department } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Users2,
  Search,
  Plus,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  Filter,
} from 'lucide-react';

export const Faculty: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>('ALL');

  // Inspection & Assigned Students Modal
  const [viewingFaculty, setViewingFaculty] = useState<any>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Add Faculty Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: 'Assistant Professor',
    subjectsTaught: 'Engineering Fundamentals',
    maxCapacity: 35,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.getFacultyList({
          departmentId: selectedDeptId !== 'ALL' ? selectedDeptId : undefined,
          search: search || undefined,
        }),
        api.getDepartments(),
      ]);

      if (facRes.success) setFaculty(facRes.faculty);
      if (deptRes.success) setDepartments(deptRes.departments);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, search]);

  const handleViewAssignedStudents = async (fac: FacultyType) => {
    try {
      setLoadingStudents(true);
      setViewingFaculty(fac);
      const res = await api.getFaculty(fac.id);
      if (res.success && res.faculty) {
        setViewingFaculty(res.faculty);
      }
    } catch (err) {
      console.error('Failed to load assigned students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const res = await api.createFaculty({
        ...addForm,
        departmentId: Number(addForm.departmentId),
        maxCapacity: Number(addForm.maxCapacity),
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          email: '',
          phone: '',
          departmentId: '',
          designation: 'Assistant Professor',
          subjectsTaught: 'Engineering Fundamentals',
          maxCapacity: 35,
        });
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create faculty member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Faculty Directory ({faculty.length} Mentors)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional mentors managing 30–35 students each under the Dean-Department hierarchy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={(e) =>
                setSelectedDeptId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search mentor or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-48 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading faculty members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map((fac) => {
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
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {fac.facultyCode}
                      </span>
                      <span className="ml-2 text-xs font-bold text-slate-600">
                        [{fac.departmentCode}]
                      </span>
                    </div>
                    <Badge variant={isFull ? 'warning' : 'success'}>
                      {fac.assignedCount} / {fac.maxCapacity} Students
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{fac.name}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{fac.designation}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{fac.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{fac.subjectsTaught}</span>
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Mentorship Workload</span>
                      <span className="font-bold text-slate-800">{fac.utilization}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${utilizationColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, fac.utilization)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Available capacity: {fac.availableCapacity} students
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleViewAssignedStudents(fac)}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-xs font-semibold text-slate-700 transition"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>View Assigned Students ({fac.assignedCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Assigned Students Drawer/Modal */}
      {viewingFaculty && (
        <Modal
          isOpen={!!viewingFaculty}
          onClose={() => setViewingFaculty(null)}
          title={`Assigned Students: ${viewingFaculty.name} (${viewingFaculty.facultyCode})`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-800">
                  Department: {viewingFaculty.department?.name || viewingFaculty.departmentName}
                </p>
                <p className="text-slate-500">Designation: {viewingFaculty.designation}</p>
              </div>
              <Badge variant="purple">
                {viewingFaculty.students?.length || viewingFaculty.assignedCount} /{' '}
                {viewingFaculty.maxCapacity} Students
              </Badge>
            </div>

            {loadingStudents ? (
              <p className="text-center py-6 text-xs text-slate-500">Loading student roster...</p>
            ) : viewingFaculty.students?.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">
                No students currently assigned to this faculty mentor.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
                {viewingFaculty.students?.map((stu: any, idx: number) => (
                  <div
                    key={stu.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-5 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                      <div>
                        <p className="font-bold text-slate-900">{stu.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{stu.studentId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700 font-medium">
                        Sem {stu.semester} ({stu.section})
                      </p>
                      <p className="text-[10px] text-slate-400">{stu.academicYear}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Faculty Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Faculty Member">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Grace Hopper"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="faculty@college.edu"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={addForm.maxCapacity}
                onChange={(e) => setAddForm({ ...addForm, maxCapacity: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Designation
            </label>
            <input
              type="text"
              placeholder="e.g. Associate Professor"
              value={addForm.designation}
              onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
              Create Faculty Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
