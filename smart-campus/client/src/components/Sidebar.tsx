import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  GitFork,
  Building2,
  Users2,
  GraduationCap,
  Shuffle,
  FileBarChart2,
  ShieldAlert,
  User,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'DEAN';

  // Role-based navigation items
  const allNavItems = [
    {
      id: 'dashboard',
      label: role === 'STUDENT' ? 'Student Portal' : 'Dashboard',
      icon: role === 'STUDENT' ? GraduationCap : LayoutDashboard,
      description:
        role === 'STUDENT'
          ? 'Academic Profile & Mentor'
          : role === 'HOD'
          ? `${user?.departmentCode || 'Dept'} Overview`
          : 'KPIs & Overview',
      roles: ['ADMIN', 'DEAN', 'HOD', 'FACULTY', 'STUDENT'],
    },
    {
      id: 'hierarchy',
      label: 'College Hierarchy',
      icon: GitFork,
      description: 'Dean → Depts → HODs → Faculty → Students',
      badge: 'Visual Tree',
      roles: ['ADMIN', 'DEAN', 'HOD'],
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building2,
      description: '8 Engineering Units',
      roles: ['ADMIN', 'DEAN'],
    },
    {
      id: 'faculty',
      label: role === 'HOD' ? 'Department Faculty' : 'Faculty Directory',
      icon: Users2,
      description: '17 Faculty & Workload Caps',
      roles: ['ADMIN', 'DEAN', 'HOD'],
    },
    {
      id: 'students',
      label: role === 'FACULTY' ? 'My Assigned Students' : 'Student Roster',
      icon: GraduationCap,
      description: role === 'FACULTY' ? 'Assigned Mentee Cohort' : '560 Student Records',
      roles: ['ADMIN', 'DEAN', 'HOD', 'FACULTY'],
    },
    {
      id: 'allocation',
      label: 'Student Allocation',
      icon: Shuffle,
      description: 'Auto-Balance & Manual Mentorship',
      badge: 'Algorithm',
      roles: ['ADMIN', 'DEAN', 'HOD'],
    },
    {
      id: 'reports',
      label: 'Reports & Audit',
      icon: FileBarChart2,
      description: 'Summaries & Activity Logs',
      roles: ['ADMIN', 'DEAN', 'HOD'],
    },
  ];

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 md:min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                isActive
                  ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm border border-indigo-100/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm tracking-tight leading-none">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[130px]">
                    {item.description}
                  </p>
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* College Info Box */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Hierarchy Rules Active</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          • 1 Dean (Leadership)
          <br />• 8 Departments (ECE, EEE, CSE, IT, MECH, CIVIL, AI&DS, BME)
          <br />• 17 Faculty (Max 35 students/faculty)
          <br />• 560 Total Enrolled Students
        </p>
      </div>
    </aside>
  );
};
