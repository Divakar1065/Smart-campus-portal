import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { studentCreateSchema, studentUpdateSchema } from '../validators';
import { logAudit } from '../utils/audit';

export async function getAllStudents(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const { departmentId, facultyId, academicYear, status, assignmentStatus, search } = req.query;

    const where: any = {};

    // Role-based scoping: If user is FACULTY, default to their own students unless specifically allowed
    if (req.user?.role === 'FACULTY' && req.user.facultyId) {
      where.facultyId = req.user.facultyId;
    } else if (req.user?.role === 'HOD' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    } else if (departmentId) {
      where.departmentId = Number(departmentId);
    }

    if (facultyId) {
      where.facultyId = Number(facultyId);
    }

    if (academicYear) {
      where.academicYear = String(academicYear);
    }

    if (status) {
      where.status = String(status);
    }

    if (assignmentStatus === 'ASSIGNED') {
      where.facultyId = { not: null };
    } else if (assignmentStatus === 'UNASSIGNED') {
      where.facultyId = null;
    }

    if (search) {
      const s = String(search).trim();
      where.OR = [
        { studentId: { contains: s } },
        { name: { contains: s } },
        { email: { contains: s } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, code: true, name: true } },
          faculty: {
            select: {
              id: true,
              facultyCode: true,
              designation: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: [{ departmentId: 'asc' }, { studentId: 'asc' }],
      }),
    ]);

    const formatted = students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      phone: s.phone,
      departmentId: s.departmentId,
      departmentCode: s.department.code,
      departmentName: s.department.name,
      facultyId: s.facultyId,
      facultyCode: s.faculty?.facultyCode || null,
      facultyName: s.faculty?.user.name || null,
      facultyEmail: s.faculty?.user.email || null,
      academicYear: s.academicYear,
      semester: s.semester,
      section: s.section,
      enrollmentDate: s.enrollmentDate,
      status: s.status,
      isAssigned: s.facultyId !== null,
    }));

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      students: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve students', error: error.message });
  }
}

export async function getStudentById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        faculty: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve student', error: error.message });
  }
}

export async function createStudent(req: AuthRequest, res: Response) {
  try {
    const parseResult = studentCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const data = parseResult.data;

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check studentId and email uniqueness
    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ studentId: data.studentId }, { email: data.email.toLowerCase() }],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.studentId === data.studentId ? 'Student ID already exists' : 'Email already exists',
      });
    }

    // If faculty is assigned at creation, validate faculty exists, belongs to same department, and has available capacity
    if (data.facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: data.facultyId },
        include: { _count: { select: { students: true } } },
      });

      if (!faculty) {
        return res.status(404).json({ success: false, message: 'Assigned faculty member not found' });
      }

      if (faculty.departmentId !== data.departmentId) {
        return res.status(400).json({
          success: false,
          message: 'Constraint violation: Assigned faculty member must belong to the same department as the student.',
        });
      }

      if (faculty._count.students >= faculty.maxCapacity) {
        return res.status(400).json({
          success: false,
          message: `Constraint violation: Faculty member ${faculty.facultyCode} is already at full capacity (${faculty.maxCapacity} students).`,
        });
      }
    }

    const student = await prisma.student.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        departmentId: data.departmentId,
        facultyId: data.facultyId || null,
        academicYear: data.academicYear,
        semester: data.semester,
        section: data.section,
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        faculty: {
          select: {
            id: true,
            facultyCode: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_STUDENT',
      entity: 'STUDENT',
      entityId: String(student.id),
      details: `Created student ${student.studentId} (${student.name}) in ${student.department.code}`,
    });

    return res.status(201).json({ success: true, student });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create student', error: error.message });
  }
}

export async function updateStudent(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const parseResult = studentUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const data = parseResult.data;

    const currentStudent = await prisma.student.findUnique({ where: { id } });
    if (!currentStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const targetDeptId = data.departmentId || currentStudent.departmentId;

    // If changing faculty assignment
    if (data.facultyId !== undefined && data.facultyId !== currentStudent.facultyId) {
      if (data.facultyId !== null) {
        const faculty = await prisma.faculty.findUnique({
          where: { id: data.facultyId },
          include: { _count: { select: { students: true } } },
        });

        if (!faculty) {
          return res.status(404).json({ success: false, message: 'Assigned faculty member not found' });
        }

        if (faculty.departmentId !== targetDeptId) {
          return res.status(400).json({
            success: false,
            message: 'Constraint violation: Assigned faculty must belong to the same department as the student.',
          });
        }

        if (faculty._count.students >= faculty.maxCapacity) {
          return res.status(400).json({
            success: false,
            message: `Constraint violation: Faculty member is at maximum capacity (${faculty.maxCapacity} students).`,
          });
        }
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.facultyId !== undefined && { facultyId: data.facultyId }),
        ...(data.academicYear && { academicYear: data.academicYear }),
        ...(data.semester !== undefined && { semester: data.semester }),
        ...(data.section && { section: data.section }),
        ...(data.status && { status: data.status }),
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        faculty: {
          select: {
            id: true,
            facultyCode: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_STUDENT',
      entity: 'STUDENT',
      entityId: String(id),
      details: `Updated student ${updated.studentId} (${updated.name})`,
    });

    return res.status(200).json({ success: true, student: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
}

export async function deleteStudent(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await prisma.student.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_STUDENT',
      entity: 'STUDENT',
      entityId: String(id),
      details: `Deleted student ${student.studentId} (${student.name})`,
    });

    return res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
  }
}

export async function exportStudentsCsv(req: AuthRequest, res: Response) {
  try {
    const { departmentId, facultyId, assignmentStatus } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = Number(departmentId);
    if (facultyId) where.facultyId = Number(facultyId);
    if (assignmentStatus === 'ASSIGNED') where.facultyId = { not: null };
    if (assignmentStatus === 'UNASSIGNED') where.facultyId = null;

    const students = await prisma.student.findMany({
      where,
      include: {
        department: { select: { code: true, name: true } },
        faculty: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { studentId: 'asc' }],
    });

    const headers = [
      'Student ID',
      'Full Name',
      'Email',
      'Phone',
      'Department Code',
      'Department Name',
      'Faculty Code',
      'Faculty Name',
      'Academic Year',
      'Semester',
      'Section',
      'Status',
    ];

    const rows = students.map((s) => [
      s.studentId,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.phone || '',
      s.department.code,
      `"${s.department.name.replace(/"/g, '""')}"`,
      s.faculty?.facultyCode || 'UNASSIGNED',
      s.faculty?.user.name ? `"${s.faculty.user.name.replace(/"/g, '""')}"` : 'UNASSIGNED',
      s.academicYear,
      s.semester,
      s.section,
      s.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="smart-campus-students.csv"');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to export students CSV', error: error.message });
  }
}

export async function importStudentsCsv(req: AuthRequest, res: Response) {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid csvData string required' });
    }

    const lines = csvData
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV must contain a header line and at least one data row' });
    }

    const departments = await prisma.department.findMany();
    const deptMap = new Map<string, number>();
    departments.forEach((d) => deptMap.set(d.code.toUpperCase(), d.id));

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Format: studentId,name,email,phone,deptCode,academicYear,semester,section
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 5) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Insufficient columns`);
        continue;
      }

      const [studentId, name, email, phone, deptCode, academicYear, semester, section] = parts;
      const deptId = deptMap.get(deptCode.toUpperCase());

      if (!deptId) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Unknown department code '${deptCode}'`);
        continue;
      }

      try {
        await prisma.student.upsert({
          where: { studentId },
          update: {
            name,
            email: email.toLowerCase(),
            phone: phone || null,
            departmentId: deptId,
            academicYear: academicYear || '2024-2028',
            semester: semester ? Number(semester) : 4,
            section: section || 'A',
          },
          create: {
            studentId,
            name,
            email: email.toLowerCase(),
            phone: phone || null,
            departmentId: deptId,
            academicYear: academicYear || '2024-2028',
            semester: semester ? Number(semester) : 4,
            section: section || 'A',
          },
        });
        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${studentId}): ${err.message}`);
      }
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'IMPORT_STUDENTS_CSV',
      entity: 'STUDENT',
      details: `Imported ${importedCount} students (${skippedCount} skipped)`,
    });

    return res.status(200).json({
      success: true,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to process CSV import', error: error.message });
  }
}
