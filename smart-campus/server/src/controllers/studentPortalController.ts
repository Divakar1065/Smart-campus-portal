import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export async function getStudentMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to student accounts' });
    }

    // Determine student record strictly from authenticated user ID
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      include: {
        department: { select: { id: true, code: true, name: true, description: true } },
        faculty: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student record associated with this user account.',
      });
    }

    return res.status(200).json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        department: student.department,
        academicYear: student.academicYear,
        semester: student.semester,
        section: student.section,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        facultyMentor: student.faculty
          ? {
              id: student.faculty.id,
              facultyCode: student.faculty.facultyCode,
              name: student.faculty.user.name,
              email: student.faculty.user.email,
              phone: student.faculty.user.phone,
              designation: student.faculty.designation,
              subjectsTaught: student.faculty.subjectsTaught,
            }
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve student profile', error: error.message });
  }
}

export async function getStudentFaculty(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to students' });
    }

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      include: {
        faculty: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            department: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    if (!student.faculty) {
      return res.status(200).json({
        success: true,
        assigned: false,
        message: 'Faculty mentor has not been assigned yet. Please contact your department HOD.',
        faculty: null,
      });
    }

    return res.status(200).json({
      success: true,
      assigned: true,
      faculty: {
        id: student.faculty.id,
        facultyCode: student.faculty.facultyCode,
        name: student.faculty.user.name,
        email: student.faculty.user.email,
        phone: student.faculty.user.phone,
        designation: student.faculty.designation,
        department: student.faculty.department.name,
        departmentCode: student.faculty.department.code,
        subjectsTaught: student.faculty.subjectsTaught,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve faculty mentor', error: error.message });
  }
}

export async function getStudentAcademicInfo(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to students' });
    }

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
      include: {
        department: {
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const subjects = student.department.subjects || [];

    return res.status(200).json({
      success: true,
      academic: {
        departmentCode: student.department.code,
        departmentName: student.department.name,
        currentSemester: student.semester,
        academicYear: student.academicYear,
        section: student.section,
        subjects: subjects.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          credits: s.credits,
          status: 'Enrolled',
        })),
        attendance: {
          hasRecords: false,
          percentage: null,
          message: 'No official attendance records published for the current cycle.',
        },
        internalMarks: {
          hasRecords: false,
          records: [],
          message: 'No internal marks published yet for Semester 4.',
        },
        assignments: {
          hasRecords: false,
          records: [],
          message: 'No pending assignments published for your section.',
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve academic information', error: error.message });
  }
}

export async function getStudentNotifications(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to students' });
    }

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: 'STUDENT' },
          ...(student ? [{ departmentId: student.departmentId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: error.message });
  }
}

export async function updateStudentProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to students' });
    }

    const { phone } = req.body;

    // Student must NOT edit studentId, departmentId, facultyId, academicYear, semester
    const updated = await prisma.$transaction(async (tx) => {
      if (phone !== undefined) {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { phone },
        });
      }

      return await tx.student.update({
        where: { userId: req.user!.id },
        data: {
          ...(phone !== undefined && { phone }),
        },
        include: {
          department: true,
          faculty: { include: { user: true } },
        },
      });
    });

    await logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_STUDENT_PROFILE',
      entity: 'STUDENT',
      entityId: String(updated.id),
      details: 'Student updated personal contact information',
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
}

export async function changeStudentPassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Access restricted to students' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'CHANGE_PASSWORD',
      entity: 'USER',
      entityId: String(user.id),
      details: 'Student changed account password',
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
  }
}
