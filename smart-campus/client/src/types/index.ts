export type UserRole = 'ADMIN' | 'DEAN' | 'HOD' | 'FACULTY' | 'STUDENT';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  departmentId?: number;
  departmentName?: string;
  departmentCode?: string;
  facultyProfile?: Faculty;
  managedDepartment?: Department;
  studentProfile?: Student;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  hodId?: number | null;
  hod?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  facultyCount: number;
  studentCount: number;
  totalCapacity: number;
  totalAssigned: number;
  unassignedStudents: number;
  capacityUtilization: number;
}

export interface Faculty {
  id: number;
  facultyCode: string;
  userId: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  designation: string;
  subjectsTaught: string;
  maxCapacity: number;
  assignedCount: number;
  availableCapacity: number;
  utilization: number;
  isAtCapacity: boolean;
  status: string;
  joiningDate?: string;
  students?: Student[];
}

export interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone?: string | null;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  facultyId?: number | null;
  facultyCode?: string | null;
  facultyName?: string | null;
  facultyEmail?: string | null;
  academicYear: string;
  semester: number;
  section: string;
  enrollmentDate: string;
  status: string;
  isAssigned: boolean;
}

export interface AcademicSubject {
  id: number;
  code: string;
  name: string;
  credits: number;
  status: string;
}

export interface StudentAcademicInfo {
  departmentCode: string;
  departmentName: string;
  currentSemester: number;
  academicYear: string;
  section: string;
  subjects: AcademicSubject[];
  attendance: {
    hasRecords: boolean;
    percentage: number | null;
    message: string;
  };
  internalMarks: {
    hasRecords: boolean;
    records: any[];
    message: string;
  };
  assignments: {
    hasRecords: boolean;
    records: any[];
    message: string;
  };
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  sender: string;
  targetRole: string;
  departmentId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface HierarchyTreeNode {
  id: string;
  type: 'DEAN' | 'DEPARTMENT' | 'HOD' | 'FACULTY' | 'STUDENT';
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  code?: string;
  totalDepartments?: number;
  totalFaculty?: number;
  totalStudents?: number;
  totalAssigned?: number;
  totalUnassigned?: number;
  totalCapacity?: number;
  overallUtilization?: number;
  departments?: any[];
}

export interface DashboardStats {
  totalDepartments: number;
  totalFaculty: number;
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalCapacity: number;
  availableCapacity: number;
  overallUtilization: number;
  averageStudentsPerFaculty: string;
}
