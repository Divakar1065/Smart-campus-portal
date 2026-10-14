import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Department, Faculty, Student } from '../types';
import { Badge } from '../components/Badge';
import {
  Shuffle,
  Users2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Scale,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const Allocation: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [deptFaculty, setDeptFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Batch Allocation State
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [targetFacultyId, setTargetFacultyId] = useState<number | ''>('');

  // Auto-Balance Settings & Results
  const [maxPerFaculty, setMaxPerFaculty] = useState<number>(35);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationSummary, setAllocationSummary] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async (deptId: number) => {
    try {
      setLoading(true);
      setMessage(null);
      setSelectedStudentIds([]);
      setTargetFacultyId('');

      const [deptRes, stuRes, facRes] = await Promise.all([
        api.getDepartments(),
        api.getStudents({
          departmentId: deptId,
          assignmentStatus: 'UNASSIGNED',
          limit: 100,
        }),
        api.getFacultyList({ departmentId: deptId }),
      ]);

      if (deptRes.success) setDepartments(deptRes.departments);
      if (stuRes.success) setUnassignedStudents(stuRes.students);
      if (facRes.success) setDeptFaculty(facRes.faculty);
    } catch (err: any) {
      console.error('Failed to load allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDeptId);
  }, [selectedDeptId]);

  const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(unassignedStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleManualBatchAssign = async () => {
    if (selectedStudentIds.length === 0 || !targetFacultyId) {
      setMessage({ type: 'error', text: 'Select at least one student and a faculty mentor.' });
      return;
    }

    try {
      setMessage(null);
      const res = await api.batchAllocate(selectedStudentIds, Number(targetFacultyId));
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Successfully assigned ${selectedStudentIds.length} students!`,
        });
        loadData(selectedDeptId);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Batch allocation failed' });
    }
  };

  const handleAutoAllocateDepartment = async () => {
    try {
      setIsAllocating(true);
      setMessage(null);
      const res = await api.autoAllocateDepartment(selectedDeptId, maxPerFaculty);
      if (res.success) {
        setAllocationSummary(res);
        setMessage({
          type: 'success',
          text: res.message || 'Auto-balanced allocation complete!',
        });
        loadData(selectedDeptId);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Auto-allocation failed' });
    } finally {
      setIsAllocating(false);
    }
  };

  const handleCampusWideAutoAllocate = async () => {
    try {
      setIsAllocating(true);
      setMessage(null);
      const res = await api.autoAllocateAll();
      if (res.success) {
        setAllocationSummary(res);
        setMessage({
          type: 'success',
          text: res.message || 'Campus-wide auto-allocation complete!',
        });
        loadData(selectedDeptId);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Campus auto-allocation failed' });
    } finally {
      setIsAllocating(false);
    }
  };

  const currentDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Shuffle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Student-Mentor Allocation Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Greedy load-balanced allocation engine ensuring mathematical workload distribution (30–35
            students/faculty)
          </p>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Algorithm Strategy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Scale className="w-3.5 h-3.5" />
            <span>Greedy Balanced Allocation Algorithm</span>
          </span>
          <h3 className="text-lg font-bold">
            Automated Workload Balancing for {currentDept?.code || 'Department'}
          </h3>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Distributes unassigned students one-by-one to whichever active faculty mentor has the
            lowest current load, stopping strictly at the configured ceiling (max 35). Never assigns
            students across departmental boundaries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-xl border border-white/10 text-xs">
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>Max Cap:</span>
            <input
              type="number"
              min="20"
              max="40"
              value={maxPerFaculty}
              onChange={(e) => setMaxPerFaculty(Number(e.target.value))}
              className="w-14 bg-white text-slate-900 font-bold px-2 py-0.5 rounded text-center"
            />
          </div>

          <button
            onClick={handleAutoAllocateDepartment}
            disabled={isAllocating || unassignedStudents.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAllocating ? 'Balancing...' : `Balance ${currentDept?.code}`}</span>
          </button>

          <button
            onClick={handleCampusWideAutoAllocate}
            disabled={isAllocating}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-slate-900 hover:bg-indigo-50 disabled:opacity-40 font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>Balance All 8 Depts</span>
          </button>
        </div>
      </div>

      {/* Split Workspace: Unassigned Queue vs Faculty Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Unassigned Students in this Department */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <span>Unassigned Students ({unassignedStudents.length})</span>
                </h4>
                <p className="text-xs text-slate-500">Students in {currentDept?.code} needing mentors</p>
              </div>

              {unassignedStudents.length > 0 && (
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudentIds.length === unassignedStudents.length &&
                      unassignedStudents.length > 0
                    }
                    onChange={handleSelectAllStudents}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Select All</span>
                </label>
              )}
            </div>

            {loading ? (
              <p className="text-center py-10 text-xs text-slate-400">Loading queue...</p>
            ) : unassignedStudents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Department Fully Allocated!</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  All active students in {currentDept?.code} are assigned to faculty mentors.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {unassignedStudents.map((stu) => {
                  const isSelected = selectedStudentIds.includes(stu.id);

                  return (
                    <div
                      key={stu.id}
                      onClick={() => toggleStudentSelection(stu.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50/70 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{stu.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{stu.studentId}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">
                        Sem {stu.semester} ({stu.section})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Batch Assignment Controls */}
          {unassignedStudents.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <select
                value={targetFacultyId}
                onChange={(e) => setTargetFacultyId(Number(e.target.value))}
                className="w-full sm:w-auto flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="">Choose Target Mentor...</option>
                {deptFaculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.assignedCount}/{f.maxCapacity} students)
                  </option>
                ))}
              </select>

              <button
                onClick={handleManualBatchAssign}
                disabled={selectedStudentIds.length === 0 || !targetFacultyId}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Assign ({selectedStudentIds.length}) Selected
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Faculty Mentors & Live Workload Gauges */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Users2 className="w-4 h-4 text-indigo-600" />
                  <span>{currentDept?.code} Faculty Mentors ({deptFaculty.length})</span>
                </h4>
                <p className="text-xs text-slate-500">Live capacity utilization meters</p>
              </div>
              <Badge variant="purple">Max {maxPerFaculty} Students</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
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
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {fac.facultyCode}
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs">{fac.name}</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{fac.designation}</p>
                      </div>
                      <Badge variant={isFull ? 'warning' : 'success'}>
                        {fac.assignedCount} / {fac.maxCapacity}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>Workload: {fac.utilization}%</span>
                        <span>{fac.availableCapacity} slots left</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${utilizationColor} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, fac.utilization)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Department Capacity:</span>
            <span className="font-bold text-slate-800">
              {deptFaculty.reduce((sum, f) => sum + f.assignedCount, 0)} Assigned /{' '}
              {deptFaculty.reduce((sum, f) => sum + f.maxCapacity, 0)} Maximum
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
