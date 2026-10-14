import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getDepartmentReport(req: AuthRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        hod: { select: { name: true, email: true, phone: true } },
        facultyMembers: {
          include: {
            user: { select: { name: true } },
            _count: { select: { students: true } },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { id: 'asc' },
    });

    const report = departments.map((d) => {
      const capacity = d.facultyMembers.reduce((sum, f) => sum + f.maxCapacity, 0);
      const assigned = d.facultyMembers.reduce((sum, f) => sum + f._count.students, 0);
      const unassigned = Math.max(0, d._count.students - assigned);

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        hodName: d.hod?.name || 'Unassigned',
        hodEmail: d.hod?.email || 'N/A',
        facultyCount: d.facultyMembers.length,
        studentCount: d._count.students,
        assignedCount: assigned,
        unassignedCount: unassigned,
        capacity,
        utilizationRate: capacity > 0 ? `${Math.round((assigned / capacity) * 100)}%` : '0%',
        facultyRatio: d.facultyMembers.length > 0 ? `1 : ${(assigned / d.facultyMembers.length).toFixed(1)}` : 'N/A',
      };
    });

    return res.status(200).json({ success: true, report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate department report', error: error.message });
  }
}

export async function getFacultyWorkloadReport(req: AuthRequest, res: Response) {
  try {
    const facultyList = await prisma.faculty.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        department: { select: { code: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { facultyCode: 'asc' }],
    });

    const report = facultyList.map((f) => {
      const assigned = f._count.students;
      const utilization = f.maxCapacity > 0 ? Math.round((assigned / f.maxCapacity) * 100) : 0;
      let statusLabel = 'Optimal';
      if (assigned < 25) statusLabel = 'Underloaded';
      else if (assigned > f.maxCapacity) statusLabel = 'Overloaded';
      else if (assigned === f.maxCapacity) statusLabel = 'At Capacity';

      return {
        id: f.id,
        facultyCode: f.facultyCode,
        name: f.user.name,
        email: f.user.email,
        phone: f.user.phone || 'N/A',
        departmentCode: f.department.code,
        designation: f.designation,
        assignedStudents: assigned,
        maxCapacity: f.maxCapacity,
        availableSlots: Math.max(0, f.maxCapacity - assigned),
        utilizationPercentage: `${utilization}%`,
        statusLabel,
      };
    });

    return res.status(200).json({ success: true, report });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate workload report', error: error.message });
  }
}

export async function getUnassignedStudentsReport(req: AuthRequest, res: Response) {
  try {
    const unassigned = await prisma.student.findMany({
      where: { facultyId: null, status: 'ACTIVE' },
      include: {
        department: { select: { code: true, name: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { studentId: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      count: unassigned.length,
      students: unassigned.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        phone: s.phone || 'N/A',
        departmentCode: s.department.code,
        departmentName: s.department.name,
        academicYear: s.academicYear,
        semester: s.semester,
        section: s.section,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve unassigned students', error: error.message });
  }
}

export async function getAuditLogsReport(req: AuthRequest, res: Response) {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs', error: error.message });
  }
}
