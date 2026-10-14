import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/Badge';
import {
  GraduationCap,
  User,
  Users2,
  BookOpen,
  Bell,
  KeyRound,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  Award,
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'profile' | 'faculty' | 'academic' | 'notifications' | 'password'
  >('dashboard');

  const [studentData, setStudentData] = useState<any>(null);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [academicData, setAcademicData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Phone state
  const [phoneInput, setPhoneInput] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Change Password state
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStudentInfo = async () => {
    try {
      setLoading(true);
      const [stuRes, facRes, acadRes, notifRes] = await Promise.all([
        api.getStudentMe(),
        api.getStudentFaculty(),
        api.getStudentAcademic(),
        api.getStudentNotifications(),
      ]);

      if (stuRes.success) {
        setStudentData(stuRes.student);
        setPhoneInput(stuRes.student.phone || '');
      }
      if (facRes.success) setFacultyData(facRes.faculty);
      if (acadRes.success) setAcademicData(acadRes.academic);
      if (notifRes.success) setNotifications(notifRes.notifications);
    } catch (err: any) {
      console.error('Failed to load student portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentInfo();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileMsg(null);
      const res = await api.updateStudentProfile({ phone: phoneInput });
      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Phone number updated successfully!' });
        loadStudentInfo();
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update contact info' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdNew !== pwdConfirm) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwdNew.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setPwdMsg(null);
      const res = await api.changeStudentPassword({
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      if (res.success) {
        setPwdMsg({ type: 'success', text: 'Password successfully changed!' });
        setPwdCurrent('');
        setPwdNew('');
        setPwdConfirm('');
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Password update failed' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Loading student records...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'faculty', label: 'My Faculty Mentor', icon: Users2 },
    { id: 'academic', label: 'Academic Information', icon: BookOpen },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notifications.length > 0 ? notifications.length : undefined,
    },
    { id: 'password', label: 'Change Password', icon: KeyRound },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/10">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Undergraduate Student Portal</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            {studentData?.name || user?.name}
          </h1>
          <p className="mt-1 text-xs text-blue-200">
            Student ID: <strong className="text-white font-mono">{studentData?.studentId}</strong> •{' '}
            {studentData?.department?.name} ({studentData?.department?.code})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="success">Active Enrollment</Badge>
          <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-medium">
            Semester {studentData?.semester} (Sec {studentData?.section})
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-400 text-white' : 'bg-indigo-100 text-indigo-700 font-bold'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Student ID</p>
              <p className="text-lg font-mono font-bold text-indigo-700 mt-1">
                {studentData?.studentId}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{studentData?.department?.code}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Academic Year</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{studentData?.academicYear}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Semester & Section</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                Sem {studentData?.semester} ({studentData?.section})
              </p>
            </div>
          </div>

          {/* Assigned Faculty Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Users2 className="w-4 h-4 text-indigo-600" />
              <span>Assigned Faculty Mentor</span>
            </h3>

            {facultyData ? (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                      {facultyData.facultyCode}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{facultyData.name}</h4>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    {facultyData.designation} • {facultyData.department}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{facultyData.email}</span>
                  </p>
                </div>

                <Badge variant="success">Active Mentor</Badge>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  No mentor assigned yet. You will be allocated shortly by your department HOD.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Personal Student Profile</h3>
            <p className="text-xs text-slate-500">
              Institutional academic registration records. Core identification fields are managed by
              administration.
            </p>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                  Student Registration ID (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={studentData?.studentId || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                  Full Name (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={studentData?.name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                  Registered Institutional Email (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={studentData?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-semibold text-[10px] mb-1">
                  Contact Phone (Student Editable)
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 9123450000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                  Department (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${studentData?.department?.code} - ${studentData?.department?.name}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                  Enrolled Academic Session (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${studentData?.academicYear} (Semester ${studentData?.semester})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
              >
                Save Contact Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: MY FACULTY MENTOR ================= */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Assigned Faculty Mentor</h3>
            <p className="text-xs text-slate-500">
              Assigned academic mentor for semester advising, coursework guidance, and internal
              evaluations
            </p>
          </div>

          {facultyData ? (
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                    {facultyData.facultyCode}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mt-1">{facultyData.name}</h4>
                  <p className="text-indigo-600 font-semibold">{facultyData.designation}</p>
                </div>
                <Badge variant="purple">{facultyData.departmentCode}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{facultyData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{facultyData.phone || 'Available via Email'}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600">
                <span className="font-semibold text-slate-800">Areas & Courses: </span>
                {facultyData.subjectsTaught}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              Mentor assignment is currently in progress for your section.
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ACADEMIC INFORMATION ================= */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Enrolled Courses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Registered Courses — Semester {academicData?.currentSemester || 4}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Curriculum courses registered under {academicData?.departmentName}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Subject Code</th>
                    <th className="py-2.5 px-3">Course Title</th>
                    <th className="py-2.5 px-3 text-center">Credits</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {academicData?.subjects?.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sub.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.name}</td>
                      <td className="py-2.5 px-3 text-center">{sub.credits}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant="success">Enrolled</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Evaluations Empty States */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="font-bold text-slate-800 text-xs mb-2">Attendance Record</p>
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 border border-slate-100">
                {academicData?.attendance?.message || 'No official attendance records available.'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="font-bold text-slate-800 text-xs mb-2">Internal Assessment Marks</p>
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 border border-slate-100">
                {academicData?.internalMarks?.message || 'No internal marks published yet.'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="font-bold text-slate-800 text-xs mb-2">Continuous Assignments</p>
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400 border border-slate-100">
                {academicData?.assignments?.message || 'No pending assignments published.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: NOTIFICATIONS ================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Campus & Academic Broadcasts</h3>
            <p className="text-xs text-slate-500">Official circulars, notifications, and reminders</p>
          </div>

          {notifications.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No active notifications.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700">{notif.sender}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{notif.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: CHANGE PASSWORD ================= */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-lg space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Change Student Account Password</h3>
            <p className="text-xs text-slate-500">
              Ensure your new password contains at least 6 characters
            </p>
          </div>

          {pwdMsg && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                pwdMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
