import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { facultyCreateSchema, facultyUpdateSchema } from '../validators';
import { logAudit } from '../utils/audit';

export async function getAllFaculty(req: AuthRequest, res: Response) {
  try {
    const { departmentId, search } = req.query;

    const where: any = {};
    if (departmentId) {
      where.departmentId = Number(departmentId);
    }
    if (search) {
      const s = String(search).toLowerCase();
      where.OR = [
        { facultyCode: { contains: s } },
        { designation: { contains: s } },
        { user: { name: { contains: s } } },
        { user: { email: { contains: s } } },
      ];
    }

    const facultyList = await prisma.faculty.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, status: true },
        },
        department: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { id: 'asc' }],
    });

    const enriched = facultyList.map((f) => {
      const assignedCount = f._count.students;
      const utilization = f.maxCapacity > 0 ? Math.round((assignedCount / f.maxCapacity) * 100) : 0;
      const availableCapacity = Math.max(0, f.maxCapacity - assignedCount);

      return {
        id: f.id,
        facultyCode: f.facultyCode,
        userId: f.userId,
        name: f.user.name,
        email: f.user.email,
        phone: f.user.phone,
        role: f.user.role,
        departmentId: f.departmentId,
        departmentCode: f.department.code,
        departmentName: f.department.name,
        designation: f.designation,
        subjectsTaught: f.subjectsTaught,
        maxCapacity: f.maxCapacity,
        assignedCount,
        availableCapacity,
        utilization,
        isAtCapacity: assignedCount >= f.maxCapacity,
        status: f.status,
        joiningDate: f.joiningDate,
      };
    });

    return res.status(200).json({ success: true, count: enriched.length, faculty: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve faculty', error: error.message });
  }
}

export async function getFacultyById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid faculty ID' });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        department: { select: { id: true, code: true, name: true } },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            phone: true,
            academicYear: true,
            semester: true,
            section: true,
            status: true,
          },
          orderBy: { studentId: 'asc' },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const assignedCount = faculty.students.length;
    const utilization = faculty.maxCapacity > 0 ? Math.round((assignedCount / faculty.maxCapacity) * 100) : 0;

    return res.status(200).json({
      success: true,
      faculty: {
        ...faculty,
        assignedCount,
        availableCapacity: Math.max(0, faculty.maxCapacity - assignedCount),
        utilization,
        isAtCapacity: assignedCount >= faculty.maxCapacity,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve faculty', error: error.message });
  }
}

export async function createFaculty(req: AuthRequest, res: Response) {
  try {
    const parseResult = facultyCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { name, email, password, phone, departmentId, designation, facultyCode, subjectsTaught, maxCapacity } =
      parseResult.data;

    // Check department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Target department does not exist' });
    }

    // Check user email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered to an existing user' });
    }

    // Generate faculty code if not provided
    const code = facultyCode || `FAC-${dept.code}-${Date.now().toString().slice(-4)}`;
    const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'FACULTY',
          phone: phone || null,
        },
      });

      const faculty = await tx.faculty.create({
        data: {
          userId: user.id,
          facultyCode: code,
          departmentId,
          designation,
          subjectsTaught: subjectsTaught || 'Engineering Courses',
          maxCapacity,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          department: { select: { id: true, code: true, name: true } },
        },
      });

      return faculty;
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_FACULTY',
      entity: 'FACULTY',
      entityId: String(result.id),
      details: `Created faculty member ${result.user.name} (${result.facultyCode}) in ${result.department.code}`,
    });

    return res.status(201).json({ success: true, faculty: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create faculty member', error: error.message });
  }
}

export async function updateFaculty(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const parseResult = facultyUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { name, phone, designation, subjectsTaught, maxCapacity, status } = parseResult.data;

    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (maxCapacity !== undefined && maxCapacity < faculty._count.students) {
      return res.status(400).json({
        success: false,
        message: `Cannot lower capacity to ${maxCapacity}: Faculty currently has ${faculty._count.students} students assigned.`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (name !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: faculty.userId },
          data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
          },
        });
      }

      return await tx.faculty.update({
        where: { id },
        data: {
          ...(designation && { designation }),
          ...(subjectsTaught && { subjectsTaught }),
          ...(maxCapacity !== undefined && { maxCapacity }),
          ...(status && { status }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          department: { select: { id: true, code: true, name: true } },
          _count: { select: { students: true } },
        },
      });
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_FACULTY',
      entity: 'FACULTY',
      entityId: String(id),
      details: `Updated faculty member ${updated.user.name}`,
    });

    return res.status(200).json({ success: true, faculty: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update faculty member', error: error.message });
  }
}

export async function deleteFaculty(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (faculty._count.students > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty member: They currently have ${faculty._count.students} assigned students. Reassign or unassign students first.`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.faculty.delete({ where: { id } });
      await tx.user.delete({ where: { id: faculty.userId } });
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_FACULTY',
      entity: 'FACULTY',
      entityId: String(id),
      details: `Deleted faculty member ${faculty.facultyCode}`,
    });

    return res.status(200).json({ success: true, message: 'Faculty member deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete faculty', error: error.message });
  }
}
