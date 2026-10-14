import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const [departments, facultyMembers, students, recentLogs] = await Promise.all([
      prisma.department.findMany({
        where: { status: 'ACTIVE' },
        include: {
          hod: { select: { name: true } },
          facultyMembers: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              maxCapacity: true,
              _count: { select: { students: true } },
            },
          },
          _count: { select: { students: true } },
        },
      }),
      prisma.faculty.findMany({
        where: { status: 'ACTIVE' },
        include: {
          user: { select: { name: true } },
          department: { select: { code: true } },
          _count: { select: { students: true } },
        },
      }),
      prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, departmentId: true, facultyId: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalStudents = students.length;
    const assignedStudents = students.filter((s) => s.facultyId !== null).length;
    const unassignedStudents = totalStudents - assignedStudents;
    const totalCapacity = facultyMembers.reduce((sum, f) => sum + f.maxCapacity, 0);

    // Department breakdown
    const departmentBreakdown = departments.map((d) => {
      const capacity = d.facultyMembers.reduce((sum, f) => sum + f.maxCapacity, 0);
      const assigned = d.facultyMembers.reduce((sum, f) => sum + f._count.students, 0);
      const deptTotalStudents = d._count.students;
      const deptUnassigned = Math.max(0, deptTotalStudents - assigned);

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        hod: d.hod?.name || 'Unassigned',
        facultyCount: d.facultyMembers.length,
        studentCount: deptTotalStudents,
        assignedStudents: assigned,
        unassignedStudents: deptUnassigned,
        capacity,
        utilization: capacity > 0 ? Math.round((assigned / capacity) * 100) : 0,
      };
    });

    // Workload distribution buckets (<25, 25-29, 30-34, 35, >35)
    const workloadBuckets = {
      underloaded: 0, // < 25
      moderate: 0,    // 25 - 29
      optimal: 0,     // 30 - 34
      atCapacity: 0,  // 35
      overloaded: 0,  // > 35
    };

    facultyMembers.forEach((f) => {
      const count = f._count.students;
      if (count < 25) workloadBuckets.underloaded++;
      else if (count <= 29) workloadBuckets.moderate++;
      else if (count <= 34) workloadBuckets.optimal++;
      else if (count === 35) workloadBuckets.atCapacity++;
      else workloadBuckets.overloaded++;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalDepartments: departments.length,
        totalFaculty: facultyMembers.length,
        totalStudents,
        assignedStudents,
        unassignedStudents,
        totalCapacity,
        availableCapacity: Math.max(0, totalCapacity - assignedStudents),
        overallUtilization: totalCapacity > 0 ? Math.round((assignedStudents / totalCapacity) * 100) : 0,
        averageStudentsPerFaculty:
          facultyMembers.length > 0 ? (assignedStudents / facultyMembers.length).toFixed(1) : '0',
      },
      departmentBreakdown,
      workloadBuckets,
      recentLogs,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats', error: error.message });
  }
}
