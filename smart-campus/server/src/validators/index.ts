import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const departmentCreateSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  hodId: z.number().int().positive().optional().nullable(),
});

export const departmentUpdateSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase().optional(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  hodId: z.number().int().positive().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const facultyCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  phone: z.string().optional().nullable(),
  departmentId: z.number().int().positive(),
  designation: z.string().min(2).max(100),
  facultyCode: z.string().min(3).max(30).optional(),
  subjectsTaught: z.string().optional(),
  maxCapacity: z.number().int().min(1).max(100).default(35),
});

export const facultyUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional().nullable(),
  designation: z.string().min(2).max(100).optional(),
  subjectsTaught: z.string().optional(),
  maxCapacity: z.number().int().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
});

export const studentCreateSchema = z.object({
  studentId: z.string().min(3).max(30),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  departmentId: z.number().int().positive(),
  facultyId: z.number().int().positive().optional().nullable(),
  academicYear: z.string().default('2024-2028'),
  semester: z.number().int().min(1).max(8).default(4),
  section: z.string().default('A'),
});

export const studentUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  departmentId: z.number().int().positive().optional(),
  facultyId: z.number().int().positive().optional().nullable(),
  academicYear: z.string().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  section: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
});

export const allocateSingleSchema = z.object({
  studentId: z.number().int().positive(),
  facultyId: z.number().int().positive().nullable(), // null means de-allocate
});

export const batchAllocateSchema = z.object({
  studentIds: z.array(z.number().int().positive()).min(1),
  facultyId: z.number().int().positive().nullable(), // null means unassign all
});

export const autoAllocateSchema = z.object({
  departmentId: z.number().int().positive(),
  maxPerFaculty: z.number().int().min(5).max(50).default(35),
});
