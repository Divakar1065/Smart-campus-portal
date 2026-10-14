// Detect API base URL:
// In production on Vercel/Netlify, set VITE_API_URL (e.g. 'https://smart-campus-api.onrender.com')
// In local development, falls back to '/api' which Vite proxies to http://localhost:5000
const rawBase: string | undefined = import.meta.env.VITE_API_URL?.trim();

export function getApiBaseUrl(): string {
  if (!rawBase) {
    return '/api';
  }
  const clean = rawBase.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

export const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('smart_campus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, clear token if expired
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('smart_campus_token');
      localStorage.removeItem('smart_campus_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const textData = await response.text();
    // Gracefully handle HTML responses (such as Vercel static 404 or hosting gateway errors)
    if (textData.trim().startsWith('<!DOCTYPE') || textData.trim().startsWith('<html') || textData.includes('<title>404')) {
      data = {
        success: false,
        message:
          response.status === 404
            ? 'API route not found (404). If deployed on Vercel, ensure VITE_API_URL is configured with your live backend server URL.'
            : `Backend returned HTML error (HTTP ${response.status}). The server may still be starting up. Please try again shortly.`,
      };
    } else {
      data = { success: false, message: textData || `HTTP ${response.status} ${response.statusText}` };
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    throw new ApiError(errorMsg, response.status, data);
  }

  if (data && typeof data === 'object' && data.success === false) {
    throw new ApiError(data.message || 'Operation failed', response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Departments
  getDepartments: () => request('/departments'),
  getDepartment: (id: number) => request(`/departments/${id}`),
  createDepartment: (data: any) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: any) =>
    request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignHod: (id: number, userId: number) =>
    request(`/departments/${id}/assign-hod`, { method: 'PUT', body: JSON.stringify({ userId }) }),
  deleteDepartment: (id: number) => request(`/departments/${id}`, { method: 'DELETE' }),

  // Faculty
  getFacultyList: (params?: { departmentId?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.departmentId) q.append('departmentId', String(params.departmentId));
    if (params?.search) q.append('search', params.search);
    return request(`/faculty?${q.toString()}`);
  },
  getFaculty: (id: number) => request(`/faculty/${id}`),
  createFaculty: (data: any) => request('/faculty', { method: 'POST', body: JSON.stringify(data) }),
  updateFaculty: (id: number, data: any) =>
    request(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaculty: (id: number) => request(`/faculty/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params?: {
    page?: number;
    limit?: number;
    departmentId?: number;
    facultyId?: number;
    assignmentStatus?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.departmentId) q.append('departmentId', String(params.departmentId));
    if (params?.facultyId) q.append('facultyId', String(params.facultyId));
    if (params?.assignmentStatus) q.append('assignmentStatus', params.assignmentStatus);
    if (params?.search) q.append('search', params.search);
    return request(`/students?${q.toString()}`);
  },
  getStudent: (id: number) => request(`/students/${id}`),
  createStudent: (data: any) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: number, data: any) =>
    request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: number) => request(`/students/${id}`, { method: 'DELETE' }),
  importStudentsCsv: (csvData: string) =>
    request('/students/import/csv', { method: 'POST', body: JSON.stringify({ csvData }) }),
  getExportCsvUrl: (params?: { departmentId?: number; assignmentStatus?: string }) => {
    const q = new URLSearchParams();
    if (params?.departmentId) q.append('departmentId', String(params.departmentId));
    if (params?.assignmentStatus) q.append('assignmentStatus', params.assignmentStatus);
    return `${API_BASE}/students/export/csv?${q.toString()}`;
  },

  // Allocation
  allocateSingle: (studentId: number, facultyId: number | null) =>
    request('/allocation/single', { method: 'POST', body: JSON.stringify({ studentId, facultyId }) }),
  batchAllocate: (studentIds: number[], facultyId: number | null) =>
    request('/allocation/batch', { method: 'POST', body: JSON.stringify({ studentIds, facultyId }) }),
  autoAllocateDepartment: (departmentId: number, maxPerFaculty = 35) =>
    request('/allocation/auto-department', { method: 'POST', body: JSON.stringify({ departmentId, maxPerFaculty }) }),
  autoAllocateAll: () => request('/allocation/auto-all', { method: 'POST' }),

  // Hierarchy
  getHierarchyTree: () => request('/hierarchy/tree'),
  searchHierarchy: (q: string) => request(`/hierarchy/search?q=${encodeURIComponent(q)}`),

  // Stats & Reports
  getDashboardStats: () => request('/stats/dashboard'),
  getDepartmentReport: () => request('/reports/departments'),
  getWorkloadReport: () => request('/reports/workload'),
  getUnassignedReport: () => request('/reports/unassigned-students'),
  getAuditLogs: () => request('/reports/audit-logs'),

  // Student Portal (Strictly authenticated to current student)
  getStudentMe: () => request('/student/me'),
  getStudentFaculty: () => request('/student/faculty'),
  getStudentAcademic: () => request('/student/academic'),
  getStudentNotifications: () => request('/student/notifications'),
  updateStudentProfile: (data: { phone?: string }) =>
    request('/student/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changeStudentPassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/student/change-password', { method: 'PUT', body: JSON.stringify(data) }),
};
