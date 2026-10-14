import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken, AuthRequest } from '../middleware/auth';
import { loginSchema } from '../validators';
import { logAudit } from '../utils/audit';

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'DEAN':
      return '/dean';
    case 'HOD':
      return '/hod';
    case 'FACULTY':
      return '/faculty';
    case 'STUDENT':
      return '/student';
    default:
      return '/';
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format',
        errors: parseResult.error.errors,
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        facultyProfile: {
          include: {
            department: true,
          },
        },
        managedDepartment: true,
        studentProfile: {
          include: {
            department: true,
            faculty: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User does not exist.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    const departmentId =
      user.managedDepartment?.id ||
      user.facultyProfile?.departmentId ||
      user.studentProfile?.departmentId;

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      facultyId: user.facultyProfile?.id,
      departmentId,
      studentProfileId: user.studentProfile?.id,
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'USER',
      entityId: String(user.id),
      details: `Successful login as ${user.role}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      redirectPath: getRoleRedirect(user.role),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        departmentId,
        departmentName:
          user.managedDepartment?.name ||
          user.facultyProfile?.department?.name ||
          user.studentProfile?.department?.name,
        departmentCode:
          user.managedDepartment?.code ||
          user.facultyProfile?.department?.code ||
          user.studentProfile?.department?.code,
        facultyProfile: user.facultyProfile,
        managedDepartment: user.managedDepartment,
        studentProfile: user.studentProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: error.message,
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        facultyProfile: {
          include: {
            department: true,
            _count: {
              select: { students: true },
            },
          },
        },
        managedDepartment: {
          include: {
            _count: {
              select: { facultyMembers: true, students: true },
            },
          },
        },
        studentProfile: {
          include: {
            department: true,
            faculty: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const departmentId =
      user.managedDepartment?.id ||
      user.facultyProfile?.departmentId ||
      user.studentProfile?.departmentId;

    return res.status(200).json({
      success: true,
      redirectPath: getRoleRedirect(user.role),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        departmentId,
        departmentName:
          user.managedDepartment?.name ||
          user.facultyProfile?.department?.name ||
          user.studentProfile?.department?.name,
        departmentCode:
          user.managedDepartment?.code ||
          user.facultyProfile?.department?.code ||
          user.studentProfile?.department?.code,
        facultyProfile: user.facultyProfile,
        managedDepartment: user.managedDepartment,
        studentProfile: user.studentProfile,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message,
    });
  }
}

export async function getDemoAccounts(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    accounts: [
      {
        role: 'ADMIN',
        title: 'System Administrator',
        email: 'admin@college.edu',
        password: 'AdminPassword123!',
        redirect: '/admin',
        description: 'Full system configuration, user provisioning, and audit logs',
      },
      {
        role: 'DEAN',
        title: 'Dean of Academic Affairs',
        email: 'dean@college.edu',
        password: 'Password123!',
        redirect: '/dean',
        description: 'Complete cross-departmental hierarchy and metrics oversight',
      },
      {
        role: 'HOD',
        title: 'HOD - Computer Science & Engineering',
        email: 'hod.cse@college.edu',
        password: 'Password123!',
        redirect: '/hod',
        description: 'Departmental management, faculty workload, and student allocations',
      },
      {
        role: 'FACULTY',
        title: 'Faculty Member - CSE',
        email: 'faculty.cse2@college.edu',
        password: 'Password123!',
        redirect: '/faculty',
        description: 'Class mentor view: assigned students, capacity, and academic records',
      },
      {
        role: 'STUDENT',
        title: 'Student Portal (Aarav Sharma - ECE)',
        email: 'student@college.edu',
        password: 'Password123!',
        redirect: '/student',
        description: 'Student portal: profile, mentor details, courses, and notifications',
      },
    ],
  });
}
