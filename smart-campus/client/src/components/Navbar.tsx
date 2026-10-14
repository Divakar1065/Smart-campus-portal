import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap,
  LogOut,
  ChevronDown,
  Building2,
  Users2,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitch } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleColors: Record<string, 'purple' | 'primary' | 'success' | 'danger' | 'gray'> = {
    ADMIN: 'danger',
    DEAN: 'purple',
    HOD: 'primary',
    FACULTY: 'success',
    STUDENT: 'primary',
  };

  const handleSwitch = async (role: 'ADMIN' | 'DEAN' | 'HOD' | 'FACULTY' | 'STUDENT') => {
    setDropdownOpen(false);
    await quickSwitch(role);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-blue-600 p-2.5 rounded-xl shadow-md text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Smart Campus</span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                Institutional Hierarchy & Management
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Dean → Departments → HODs → Faculty → Students → Student Portal
            </p>
          </div>
        </div>

        {/* Right: User Status & Switcher */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Quick Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition text-xs font-medium text-slate-700"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="hidden md:inline">Demo Switch (5 Roles)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Switch Role (Live Demonstration)
                    </p>
                  </div>
                  <button
                    onClick={() => handleSwitch('ADMIN')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Administrator</p>
                      <p className="text-[11px] text-slate-500">Global system setup & audit</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSwitch('DEAN')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Dean of Academic Affairs</p>
                      <p className="text-[11px] text-slate-500">Cross-department hierarchy view</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSwitch('HOD')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">HOD (CSE Department)</p>
                      <p className="text-[11px] text-slate-500">Department faculty & student allocation</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSwitch('FACULTY')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Users2 className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Faculty Member (CSE)</p>
                      <p className="text-[11px] text-slate-500">Assigned 32-student mentee cohort</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSwitch('STUDENT')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center space-x-2.5 hover:bg-slate-50 transition"
                  >
                    <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                      <User className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Student Portal (ECE)</p>
                      <p className="text-[11px] text-slate-500">Profile, mentor, courses & notices</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Current User Pill */}
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                  <Badge variant={roleColors[user.role] || 'primary'}>{user.role}</Badge>
                  {user.departmentCode && (
                    <span className="text-[11px] font-medium text-slate-500">
                      [{user.departmentCode}]
                    </span>
                  )}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
