import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { departmentCreateSchema, departmentUpdateSchema } from '../validators';
import { logAudit } from '../utils/audit';

export async function getAllDepartments(req: AuthRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        hod: {
          select: { id: true, name: true, email: true, phone: true },
        },
        facultyMembers: {
          select: {
            id: true,
            facultyCode: true,
            designation: true,
            maxCapacity: true,
            _count: {
              select: { students: true },
            },
          },
        },
        _count: {
          select: {
            facultyMembers: true,
            students: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const enriched = departments.map((d) => {
      const totalCapacity = d.facultyMembers.reduce((sum, f) => sum + f.maxCapacity, 0);
      const totalAssigned = d.facultyMembers.reduce((sum, f) => sum + f._count.students, 0);
      const unassignedStudents = Math.max(0, d._count.students - totalAssigned);

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        status: d.status,
        hod: d.hod,
        facultyCount: d._count.facultyMembers,
        studentCount: d._count.students,
        totalCapacity,
        totalAssigned,
        unassignedStudents,
        capacityUtilization: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
      };
    });

    return res.status(200).json({ success: true, departments: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve departments', error: error.message });
  }
}

export async function getDepartmentById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID' });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        hod: {
          select: { id: true, name: true, email: true, phone: true },
        },
        facultyMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: { students: true, facultyMembers: true },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const totalCapacity = department.facultyMembers.reduce((sum, f) => sum + f.maxCapacity, 0);
    const totalAssigned = department.facultyMembers.reduce((sum, f) => sum + f._count.students, 0);
    const unassignedStudents = Math.max(0, department._count.students - totalAssigned);

    return res.status(200).json({
      success: true,
      department: {
        ...department,
        totalCapacity,
        totalAssigned,
        unassignedStudents,
        capacityUtilization: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve department', error: error.message });
  }
}

export async function createDepartment(req: AuthRequest, res: Response) {
  try {
    const parseResult = departmentCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const { code, name, description, hodId } = parseResult.data;

    const existingCode = await prisma.department.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(409).json({ success: false, message: `Department code '${code}' already exists.` });
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
        description,
        hodId: hodId ?? null,
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'CREATE_DEPARTMENT',
      entity: 'DEPARTMENT',
      entityId: String(department.id),
      details: `Created department ${code} - ${name}`,
    });

    return res.status(201).json({ success: true, department });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create department', error: error.message });
  }
}

export async function updateDepartment(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID' });
    }

    const parseResult = departmentUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.errors });
    }

    const department = await prisma.department.update({
      where: { id },
      data: parseResult.data,
      include: {
        hod: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'UPDATE_DEPARTMENT',
      entity: 'DEPARTMENT',
      entityId: String(id),
      details: `Updated department ${department.code}`,
    });

    return res.status(200).json({ success: true, department });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update department', error: error.message });
  }
}

export async function assignHod(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const { userId } = req.body;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ success: false, message: 'Valid userId required for HOD assignment' });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Target user does not exist' });
    }

    // Update user role to HOD if needed
    if (user.role !== 'HOD') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'HOD' },
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { hodId: user.id },
      include: {
        hod: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'ASSIGN_HOD',
      entity: 'DEPARTMENT',
      entityId: String(id),
      details: `Assigned ${user.name} as HOD for ${department.code}`,
    });

    return res.status(200).json({ success: true, department });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to assign HOD', error: error.message });
  }
}

export async function deleteDepartment(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { facultyMembers: true, students: true } },
      },
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (dept._count.facultyMembers > 0 || dept._count.students > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: It currently contains ${dept._count.facultyMembers} faculty and ${dept._count.students} students. Reassign or remove them first.`,
      });
    }

    await prisma.department.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      action: 'DELETE_DEPARTMENT',
      entity: 'DEPARTMENT',
      entityId: String(id),
      details: `Deleted department ${dept.code}`,
    });

    return res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
  }
}
