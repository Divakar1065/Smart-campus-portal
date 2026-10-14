import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { allocateSingleSchema, batchAllocateSchema, autoAllocateSchema } from '../validators';
import { logAudit } from '../utils/audit';

export async function allocateSingle(req: AuthRequest, res: Response) {
  try {
    const parseResult = allocateSingleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { studentId, facultyId } = parseResult.data;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role-based authorization: HOD can only allocate in their own department
    if (req.user?.role === 'HOD' && req.user.departmentId && req.user.departmentId !== student.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only allocate students within your own department',
      });
    }

    // If unassigning
    if (facultyId === null) {
      const updated = await prisma.student.update({
        where: { id: studentId },
        data: { facultyId: null },
      });

      await logAudit({
        userId: req.user?.id,
        userName: req.user?.name || 'User',
        action: 'DEALLOCATE_STUDENT',
        entity: 'STUDENT',
        entityId: String(studentId),
        details: `Unassigned student ${student.studentId} (${student.name})`,
      });

      return res.status(200).json({
        success: true,
        message: `Student ${student.studentId} unassigned successfully`,
        student: updated,
      });
    }

    // Assigning to a faculty member
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    // Constraint 1: Department match
    if (faculty.departmentId !== student.departmentId) {
      return res.status(400).json({
        success: false,
        message: `Constraint violation: Faculty ${faculty.facultyCode} belongs to a different department than student ${student.studentId}.`,
      });
    }

    // Constraint 2: Capacity limit
    if (faculty._count.students >= faculty.maxCapacity && student.facultyId !== faculty.id) {
      return res.status(400).json({
        success: false,
        message: `Constraint violation: Faculty ${faculty.user.name} is already at full capacity (${faculty.maxCapacity} students).`,
      });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { facultyId },
      include: {
        department: { select: { code: true, name: true } },
        faculty: {
          select: {
            id: true,
            facultyCode: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'User',
      action: 'ALLOCATE_STUDENT',
      entity: 'STUDENT',
      entityId: String(studentId),
      details: `Assigned student ${student.studentId} to faculty ${faculty.user.name} (${faculty.facultyCode})`,
    });

    return res.status(200).json({
      success: true,
      message: `Assigned student ${student.studentId} to ${faculty.user.name}`,
      student: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Allocation failed', error: error.message });
  }
}

export async function batchAllocate(req: AuthRequest, res: Response) {
  try {
    const parseResult = batchAllocateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { studentIds, facultyId } = parseResult.data;

    // Unassign batch
    if (facultyId === null) {
      const result = await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { facultyId: null },
      });

      await logAudit({
        userId: req.user?.id,
        userName: req.user?.name || 'User',
        action: 'BATCH_DEALLOCATE',
        entity: 'STUDENT',
        details: `Batch unassigned ${result.count} students`,
      });

      return res.status(200).json({
        success: true,
        message: `Successfully unassigned ${result.count} students.`,
        count: result.count,
      });
    }

    // Assign batch to target faculty
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: { select: { name: true } },
        _count: { select: { students: true } },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const availableSlots = faculty.maxCapacity - faculty._count.students;
    if (studentIds.length > availableSlots) {
      return res.status(400).json({
        success: false,
        message: `Capacity exceeded: Faculty ${faculty.user.name} only has ${availableSlots} available slots, but ${studentIds.length} students were selected.`,
      });
    }

    // Check all selected students belong to same department
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, studentId: true, departmentId: true },
    });

    const foreignStudents = students.filter((s) => s.departmentId !== faculty.departmentId);
    if (foreignStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Constraint violation: ${foreignStudents.length} selected student(s) do not belong to faculty's department (${faculty.facultyCode}).`,
      });
    }

    const updateResult = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { facultyId },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'User',
      action: 'BATCH_ALLOCATE',
      entity: 'FACULTY',
      entityId: String(facultyId),
      details: `Batch assigned ${updateResult.count} students to ${faculty.user.name} (${faculty.facultyCode})`,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${updateResult.count} students to ${faculty.user.name}.`,
      count: updateResult.count,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Batch allocation failed', error: error.message });
  }
}

export async function autoAllocateDepartment(req: AuthRequest, res: Response) {
  try {
    const parseResult = autoAllocateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { departmentId, maxPerFaculty } = parseResult.data;

    // Check HOD authorization
    if (req.user?.role === 'HOD' && req.user.departmentId && req.user.departmentId !== departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only auto-allocate students for your own department',
      });
    }

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // 1. Fetch all unassigned students in this department
    const unassignedStudents = await prisma.student.findMany({
      where: {
        departmentId,
        facultyId: null,
        status: 'ACTIVE',
      },
      orderBy: { studentId: 'asc' },
    });

    if (unassignedStudents.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No unassigned students in department ${dept.code}. All active students are already allocated.`,
        allocatedCount: 0,
        remainingUnassigned: 0,
      });
    }

    // 2. Fetch all active faculty in this department with their current student count
    const facultyList = await prisma.faculty.findMany({
      where: {
        departmentId,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    if (facultyList.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active faculty members available in ${dept.code} to receive allocations.`,
      });
    }

    // 3. Balanced greedy allocation algorithm
    // Maintain state for each faculty: { id, name, currentCount, effectiveMaxCapacity }
    const facultyState = facultyList.map((f) => ({
      id: f.id,
      name: f.user.name,
      facultyCode: f.facultyCode,
      currentCount: f._count.students,
      maxCapacity: Math.min(f.maxCapacity, maxPerFaculty),
      allocatedHere: 0,
    }));

    const allocations: { studentId: number; facultyId: number }[] = [];
    const unallocatedStudentIds: number[] = [];

    for (const student of unassignedStudents) {
      // Find faculty member with available capacity and the MINIMUM current load (greedy balance)
      let bestCandidate: (typeof facultyState)[0] | null = null;
      let minLoad = Infinity;

      for (const f of facultyState) {
        if (f.currentCount < f.maxCapacity) {
          if (f.currentCount < minLoad) {
            minLoad = f.currentCount;
            bestCandidate = f;
          }
        }
      }

      if (bestCandidate) {
        bestCandidate.currentCount++;
        bestCandidate.allocatedHere++;
        allocations.push({ studentId: student.id, facultyId: bestCandidate.id });
      } else {
        // All faculty members in department are at maximum capacity!
        unallocatedStudentIds.push(student.id);
      }
    }

    // 4. Perform atomic transactional updates
    await prisma.$transaction(
      allocations.map((a) =>
        prisma.student.update({
          where: { id: a.studentId },
          data: { facultyId: a.facultyId },
        })
      )
    );

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'System',
      action: 'AUTO_ALLOCATE',
      entity: 'DEPARTMENT',
      entityId: String(departmentId),
      details: `Auto-allocated ${allocations.length} students across ${facultyState.length} faculty members in ${dept.code}`,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully balanced and allocated ${allocations.length} students in ${dept.code}.`,
      departmentCode: dept.code,
      allocatedCount: allocations.length,
      remainingUnassigned: unallocatedStudentIds.length,
      facultyWorkloads: facultyState.map((f) => ({
        facultyId: f.id,
        name: f.name,
        code: f.facultyCode,
        newAssignedCount: f.currentCount,
        addedInThisRun: f.allocatedHere,
        maxCapacity: f.maxCapacity,
        utilization: Math.round((f.currentCount / f.maxCapacity) * 100),
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Auto-allocation failed', error: error.message });
  }
}

export async function autoAllocateAllDepartments(req: AuthRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, code: true },
    });

    let totalAllocated = 0;
    let totalRemaining = 0;
    const summaries: any[] = [];

    for (const dept of departments) {
      const unassignedStudents = await prisma.student.findMany({
        where: { departmentId: dept.id, facultyId: null, status: 'ACTIVE' },
        orderBy: { studentId: 'asc' },
      });

      if (unassignedStudents.length === 0) continue;

      const facultyList = await prisma.faculty.findMany({
        where: { departmentId: dept.id, status: 'ACTIVE' },
        include: { user: { select: { name: true } }, _count: { select: { students: true } } },
      });

      if (facultyList.length === 0) continue;

      const facultyState = facultyList.map((f) => ({
        id: f.id,
        name: f.user.name,
        currentCount: f._count.students,
        maxCapacity: f.maxCapacity,
        allocatedHere: 0,
      }));

      const allocations: { studentId: number; facultyId: number }[] = [];

      for (const student of unassignedStudents) {
        let bestCandidate: (typeof facultyState)[0] | null = null;
        let minLoad = Infinity;

        for (const f of facultyState) {
          if (f.currentCount < f.maxCapacity && f.currentCount < minLoad) {
            minLoad = f.currentCount;
            bestCandidate = f;
          }
        }

        if (bestCandidate) {
          bestCandidate.currentCount++;
          bestCandidate.allocatedHere++;
          allocations.push({ studentId: student.id, facultyId: bestCandidate.id });
        }
      }

      if (allocations.length > 0) {
        await prisma.$transaction(
          allocations.map((a) =>
            prisma.student.update({
              where: { id: a.studentId },
              data: { facultyId: a.facultyId },
            })
          )
        );
      }

      totalAllocated += allocations.length;
      totalRemaining += unassignedStudents.length - allocations.length;

      summaries.push({
        departmentCode: dept.code,
        allocated: allocations.length,
        remaining: unassignedStudents.length - allocations.length,
      });
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'System',
      action: 'AUTO_ALLOCATE_ALL',
      entity: 'COLLEGE',
      details: `Campus-wide auto-allocation: Assigned ${totalAllocated} students.`,
    });

    return res.status(200).json({
      success: true,
      message: `Campus-wide balanced allocation complete: ${totalAllocated} students allocated.`,
      totalAllocated,
      totalRemaining,
      departments: summaries,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Campus auto-allocation failed', error: error.message });
  }
}
