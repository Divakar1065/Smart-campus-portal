import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickSwitch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email address and password');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = async (role: 'DEAN' | 'HOD' | 'FACULTY' | 'ADMIN' | 'STUDENT') => {
    try {
      setError(null);
      setIsSubmitting(true);
      await quickSwitch(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl shadow-lg text-white mb-4">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Smart Campus Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Hierarchy & Student Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. dean@college.edu"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Campus</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Cards */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demonstration Logins
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => handleDemoSelect('DEAN')}
                className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-left transition group"
              >
                <div className="flex items-center space-x-1.5 text-purple-700 font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  <span>Dean</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 truncate">Dr. Arthur Pendelton</p>
                <p className="text-[10px] text-purple-600 font-medium">dean@college.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('HOD')}
                className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-left transition group"
              >
                <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                  <span>HOD (CSE)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 truncate">Dr. Alan Turing</p>
                <p className="text-[10px] text-blue-600 font-medium">hod.cse@college.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('FACULTY')}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition group"
              >
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                  <Users2 className="w-4 h-4" />
                  <span>Faculty</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 truncate">Prof. Dennis Ritchie</p>
                <p className="text-[10px] text-emerald-600 font-medium">faculty.cse2@college.edu</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('ADMIN')}
                className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-left transition group"
              >
                <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 truncate">System Administrator</p>
                <p className="text-[10px] text-rose-600 font-medium">admin@college.edu</p>
              </button>
            </div>

            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => handleDemoSelect('STUDENT')}
                className="w-full p-3 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/80 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">
                      Student Portal — Aarav Sharma (ECE)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Personal academic records, mentor, and notices (student@college.edu)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-sky-700 px-2 py-0.5 rounded bg-white border border-sky-200">
                  Try Student View
                </span>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-3">
              Standard local demo password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
