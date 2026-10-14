import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'DEAN' | 'HOD' | 'FACULTY' | 'STUDENT';
  facultyId?: number;
  departmentId?: number;
  studentProfileId?: number;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'smart-campus-super-secret-key-2026';

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      facultyId: user.facultyId,
      departmentId: user.departmentId,
      studentProfileId: user.studentProfileId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        facultyProfile: true,
        managedDepartment: true,
        studentProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
    }

    const departmentId =
      user.managedDepartment?.id ||
      user.facultyProfile?.departmentId ||
      user.studentProfile?.departmentId;

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      facultyId: user.facultyProfile?.id,
      departmentId,
      studentProfileId: user.studentProfile?.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

export function requireDepartmentScope(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // DEAN and ADMIN have global clearance across all departments
  if (req.user.role === 'DEAN' || req.user.role === 'ADMIN') {
    return next();
  }

  // HOD must only manage their own department
  const requestedDeptId = req.params.departmentId || req.body.departmentId || req.query.departmentId;
  if (requestedDeptId && Number(requestedDeptId) !== req.user.departmentId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You only have permission to manage resources within your own department.',
    });
  }

  next();
}
