import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Department } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Building2,
  Users2,
  GraduationCap,
  Plus,
  Edit2,
  UserCheck,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignHodOpen, setIsAssignHodOpen] = useState(false);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  // New Department Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      if (res.success) {
        setDepartments(res.departments);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAssignHod = async (dept: Department) => {
    setSelectedDept(dept);
    setSelectedFacultyId('');
    try {
      const res = await api.getFacultyList({ departmentId: dept.id });
      if (res.success) {
        setFacultyList(res.faculty);
      }
    } catch (err) {
      console.error('Failed to load faculty for HOD assignment:', err);
    }
    setIsAssignHodOpen(true);
  };

  const handleAssignHodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !selectedFacultyId) return;

    try {
      setFormError(null);
      // Faculty object has userId
      const targetFac = facultyList.find((f) => f.id === Number(selectedFacultyId));
      if (!targetFac) return;

      const res = await api.assignHod(selectedDept.id, targetFac.userId);
      if (res.success) {
        setIsAssignHodOpen(false);
        loadDepartments();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign HOD');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError(null);
      const res = await api.createDepartment({
        code: newCode.toUpperCase().trim(),
        name: newName.trim(),
        description: newDesc.trim(),
      });
      if (res.success) {
        setIsModalOpen(false);
        setNewCode('');
        setNewName('');
        setNewDesc('');
        loadDepartments();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create department');
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Academic Departments ({departments.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional division of departments, appointed HODs, faculty count, and student quotas
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-52 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading departments...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    {dept.code}
                  </span>
                  <Badge variant={dept.capacityUtilization > 95 ? 'warning' : 'success'}>
                    {dept.capacityUtilization}% Filled
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {dept.description || 'Core engineering division offering undergraduate programs.'}
                </p>

                {/* HOD Status */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Head of Department</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-bold text-slate-800">
                      {dept.hod?.name || 'Unassigned'}
                    </p>
                    <button
                      onClick={() => handleOpenAssignHod(dept)}
                      title="Change / Assign HOD"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Assign
                    </button>
                  </div>
                  {dept.hod?.email && (
                    <p className="text-[10px] text-slate-400 truncate">{dept.hod.email}</p>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Faculty</p>
                  <p className="text-sm font-bold text-slate-800">{dept.facultyCount}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Students</p>
                  <p className="text-sm font-bold text-slate-800">
                    {dept.totalAssigned} / {dept.studentCount}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Academic Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Code
            </label>
            <input
              type="text"
              placeholder="e.g. MECH, CSE, AERO"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Name
            </label>
            <input
              type="text"
              placeholder="e.g. Aerospace Engineering"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief description of the department..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign HOD Modal */}
      <Modal
        isOpen={isAssignHodOpen}
        onClose={() => setIsAssignHodOpen(false)}
        title={`Assign HOD for ${selectedDept?.name}`}
      >
        <form onSubmit={handleAssignHodSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {formError}
            </div>
          )}

          <p className="text-slate-600">
            Select a faculty member from <strong>{selectedDept?.code}</strong> to serve as the Head of
            Department.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Eligible Department Faculty
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select a Faculty Member...</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.facultyCode}) — {f.designation}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAssignHodOpen(false)}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Confirm HOD Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
