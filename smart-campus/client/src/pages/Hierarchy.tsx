import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  GitFork,
  GraduationCap,
  Building2,
  Users2,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Search,
  Maximize2,
  Minimize2,
  Printer,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const Hierarchy: React.FC = () => {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeDeptFilter, setActiveDeptFilter] = useState<string>('ALL');

  // Expanded states: keys are department ID strings or faculty ID strings
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedFaculty, setExpandedFaculty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadTree() {
      try {
        const res = await api.getHierarchyTree();
        if (res.success && res.hierarchy) {
          setTreeData(res.hierarchy);
          // By default expand all departments
          const deptsOpen: Record<string, boolean> = {};
          res.hierarchy.departments?.forEach((d: any) => {
            deptsOpen[d.id] = true;
          });
          setExpandedDepts(deptsOpen);
        }
      } catch (err) {
        console.error('Failed to load hierarchy tree:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, []);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const toggleFaculty = (facId: string) => {
    setExpandedFaculty((prev) => ({ ...prev, [facId]: !prev[facId] }));
  };

  const expandAll = () => {
    if (!treeData) return;
    const deptsOpen: Record<string, boolean> = {};
    const facOpen: Record<string, boolean> = {};
    treeData.departments?.forEach((d: any) => {
      deptsOpen[d.id] = true;
      d.facultyMembers?.forEach((f: any) => {
        facOpen[f.id] = true;
      });
    });
    setExpandedDepts(deptsOpen);
    setExpandedFaculty(facOpen);
  };

  const collapseAll = () => {
    setExpandedDepts({});
    setExpandedFaculty({});
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Constructing college hierarchy tree...</span>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Hierarchy tree unavailable. Please check backend connection.
      </div>
    );
  }

  const filteredDepts = (treeData.departments || []).filter((dept: any) => {
    if (activeDeptFilter !== 'ALL' && dept.code !== activeDeptFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const deptMatch = dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
    const hodMatch = dept.hod?.name?.toLowerCase().includes(q);
    const facultyMatch = dept.facultyMembers.some(
      (f: any) =>
        f.name.toLowerCase().includes(q) ||
        f.facultyCode.toLowerCase().includes(q) ||
        f.students.some(
          (s: any) => s.studentId.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
    );
    return deptMatch || hodMatch || facultyMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <GitFork className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Institutional College Hierarchy
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual recursive structure: Dean → 8 Departments → HODs → 17 Faculty Mentors → 560
            Students
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, faculty, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-60 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Tree controls */}
          <button
            onClick={expandAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Tree</span>
          </button>
        </div>
      </div>

      {/* Department Quick Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveDeptFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeDeptFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Departments ({treeData.departments?.length || 8})
        </button>
        {treeData.departments?.map((d: any) => (
          <button
            key={d.id}
            onClick={() => setActiveDeptFilter(d.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeDeptFilter === d.code
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {d.code} ({d.facultyCount} Fac • {d.studentCount} Stu)
          </button>
        ))}
      </div>

      {/* ================= LEVEL 1: DEAN OF ACADEMIC AFFAIRS ================= */}
      <div className="flex flex-col items-center">
        <div
          onClick={() => setSelectedNode(treeData)}
          className="cursor-pointer max-w-xl w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border-2 border-purple-400/30 hover:border-purple-300 transition-all duration-200 relative group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <GraduationCap className="w-8 h-8 text-purple-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/20">
                  Apex Level Leadership
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white mt-1">
                  {treeData.name}
                </h3>
                <p className="text-xs text-purple-200">{treeData.title}</p>
              </div>
            </div>
            <Badge variant="purple">LEVEL 1</Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[10px] uppercase font-semibold text-purple-200">Departments</p>
              <p className="text-base font-bold">{treeData.totalDepartments}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[10px] uppercase font-semibold text-purple-200">Total Faculty</p>
              <p className="text-base font-bold">{treeData.totalFaculty}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[10px] uppercase font-semibold text-purple-200">Students</p>
              <p className="text-base font-bold">{treeData.totalStudents}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2">
              <p className="text-[10px] uppercase font-semibold text-purple-200">Utilization</p>
              <p className="text-base font-bold">{treeData.overallUtilization}%</p>
            </div>
          </div>
        </div>

        {/* Tree Connection Line Down */}
        <div className="w-0.5 h-8 bg-indigo-300 my-1" />
      </div>

      {/* ================= LEVEL 2: DEPARTMENTS (8 UNITS) ================= */}
      <div className="space-y-6">
        {filteredDepts.map((dept: any) => {
          const isDeptExpanded = expandedDepts[dept.id] ?? false;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Department Header Card */}
              <div
                onClick={() => toggleDept(dept.id)}
                className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <button className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition">
                    {isDeptExpanded ? (
                      <ChevronDown className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm font-bold text-sm tracking-wider">
                    {dept.code}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-slate-900">{dept.name}</h4>
                      <Badge variant="primary">LEVEL 2</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Managed by HOD: <strong className="text-slate-800">{dept.hod?.name || 'Unassigned'}</strong>
                    </p>
                  </div>
                </div>

                {/* Dept Metrics Pills */}
                <div className="flex items-center space-x-3 text-xs">
                  <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                    {dept.facultyCount} Faculty
                  </div>
                  <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                    {dept.assignedCount} / {dept.studentCount} Students ({dept.utilization}% load)
                  </div>
                  {dept.unassignedCount > 0 && (
                    <Badge variant="warning">{dept.unassignedCount} Unassigned</Badge>
                  )}
                </div>
              </div>

              {/* Department Body (When Expanded) */}
              {isDeptExpanded && (
                <div className="p-6 bg-slate-50/50 space-y-6">
                  {/* LEVEL 3: HOD Card */}
                  <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            Department Head (HOD)
                          </span>
                          <Badge variant="primary">LEVEL 3</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {dept.hod?.name || 'Unassigned HOD'}
                        </p>
                        <p className="text-xs text-slate-500">{dept.hod?.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      Direct reports: <strong className="text-slate-800">{dept.facultyCount}</strong> Faculty Members
                    </div>
                  </div>

                  {/* LEVEL 4: Faculty Members */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                        <Users2 className="w-4 h-4 text-indigo-600" />
                        <span>Faculty Mentors ({dept.facultyMembers.length})</span>
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Max Capacity: 35 students per mentor
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dept.facultyMembers.map((fac: any) => {
                        const isFacExpanded = expandedFaculty[fac.id] ?? false;
                        const utilizationColor =
                          fac.utilization >= 100
                            ? 'bg-rose-500'
                            : fac.utilization >= 85
                            ? 'bg-indigo-600'
                            : 'bg-emerald-500';

                        return (
                          <div
                            key={fac.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                    {fac.facultyCode}
                                  </span>
                                  <h6 className="text-sm font-bold text-slate-900 mt-1">
                                    {fac.name}
                                  </h6>
                                  <p className="text-xs text-slate-500">{fac.designation}</p>
                                </div>
                                <Badge variant={fac.isAtCapacity ? 'warning' : 'success'}>
                                  {fac.studentCount} / {fac.maxCapacity}
                                </Badge>
                              </div>

                              {/* Capacity meter */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                  <span>Workload Meter</span>
                                  <span className="font-semibold text-slate-700">
                                    {fac.utilization}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`${utilizationColor} h-1.5 rounded-full`}
                                    style={{ width: `${Math.min(100, fac.utilization)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* LEVEL 5: Expandable Student List */}
                            <div className="border-t border-slate-100 bg-slate-50/70 p-3">
                              <button
                                onClick={() => toggleFaculty(fac.id)}
                                className="w-full flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                              >
                                <span>
                                  {isFacExpanded ? 'Hide' : 'View'} {fac.studentCount} Assigned Students
                                </span>
                                {isFacExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>

                              {isFacExpanded && (
                                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1 pt-1 border-t border-slate-200/60">
                                  {fac.students.map((stu: any) => (
                                    <div
                                      key={stu.id}
                                      onClick={() => setSelectedNode(stu)}
                                      className="cursor-pointer bg-white p-2 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between hover:border-indigo-300 hover:bg-indigo-50/30 transition"
                                    >
                                      <div>
                                        <span className="font-mono font-bold text-slate-700">
                                          {stu.studentId}
                                        </span>
                                        <p className="font-medium text-slate-900 truncate max-w-[140px]">
                                          {stu.name}
                                        </p>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        Sem {stu.semester} ({stu.section})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unassigned Students for this Department */}
                  {dept.unassignedStudents?.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-800">
                          Unassigned Students in {dept.code} ({dept.unassignedStudents.length})
                        </span>
                        <span className="text-[11px] text-amber-700">Awaiting Faculty Mentor</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dept.unassignedStudents.map((stu: any) => (
                          <span
                            key={stu.id}
                            className="bg-white border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-mono font-medium shadow-2xs"
                          >
                            {stu.studentId} - {stu.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Node Details Inspection Modal */}
      {selectedNode && (
        <Modal
          isOpen={!!selectedNode}
          onClose={() => setSelectedNode(null)}
          title={`Node Details: ${selectedNode.name || selectedNode.studentId}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Node Type</p>
                <p className="text-sm font-bold text-indigo-700">{selectedNode.type}</p>
              </div>
              <Badge variant="purple">{selectedNode.type}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Identifier</p>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  {selectedNode.studentId || selectedNode.code || selectedNode.facultyCode || selectedNode.id}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-400 uppercase font-semibold text-[10px]">Contact Email</p>
                <p className="font-semibold text-slate-900 mt-1 truncate">
                  {selectedNode.email || 'N/A'}
                </p>
              </div>
            </div>

            {selectedNode.academicYear && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <p className="text-slate-500">
                  Enrolled in Academic Session <strong>{selectedNode.academicYear}</strong>, Semester{' '}
                  <strong>{selectedNode.semester}</strong>, Section{' '}
                  <strong>{selectedNode.section}</strong>.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
