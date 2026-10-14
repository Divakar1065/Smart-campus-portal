import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getHierarchyTree(req: AuthRequest, res: Response) {
  try {
    // 1. Fetch Dean info
    const deanUser = await prisma.user.findFirst({
      where: { role: 'DEAN', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    // 2. Fetch all departments with HOD, faculty, and assigned students
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        hod: {
          select: { id: true, name: true, email: true, phone: true },
        },
        facultyMembers: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            students: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
                academicYear: true,
                semester: true,
                section: true,
              },
              orderBy: { studentId: 'asc' },
            },
          },
          orderBy: { facultyCode: 'asc' },
        },
        students: {
          where: { facultyId: null, status: 'ACTIVE' },
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            academicYear: true,
            semester: true,
            section: true,
          },
          orderBy: { studentId: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    let totalCollegeFaculty = 0;
    let totalCollegeStudents = 0;
    let totalCollegeAssigned = 0;
    let totalCollegeCapacity = 0;

    const departmentNodes = departments.map((d) => {
      let deptAssignedStudents = 0;
      let deptCapacity = 0;

      const facultyNodes = d.facultyMembers.map((f) => {
        const studentCount = f.students.length;
        deptAssignedStudents += studentCount;
        deptCapacity += f.maxCapacity;

        return {
          id: `faculty-${f.id}`,
          rawId: f.id,
          type: 'FACULTY',
          name: f.user.name,
          email: f.user.email,
          phone: f.user.phone,
          facultyCode: f.facultyCode,
          designation: f.designation,
          subjectsTaught: f.subjectsTaught,
          maxCapacity: f.maxCapacity,
          studentCount,
          utilization: f.maxCapacity > 0 ? Math.round((studentCount / f.maxCapacity) * 100) : 0,
          isAtCapacity: studentCount >= f.maxCapacity,
          students: f.students.map((s) => ({
            id: `student-${s.id}`,
            rawId: s.id,
            type: 'STUDENT',
            studentId: s.studentId,
            name: s.name,
            email: s.email,
            academicYear: s.academicYear,
            semester: s.semester,
            section: s.section,
          })),
        };
      });

      const unassignedStudents = d.students.map((s) => ({
        id: `student-${s.id}`,
        rawId: s.id,
        type: 'STUDENT',
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        academicYear: s.academicYear,
        semester: s.semester,
        section: s.section,
        isUnassigned: true,
      }));

      const totalDeptStudents = deptAssignedStudents + unassignedStudents.length;

      totalCollegeFaculty += d.facultyMembers.length;
      totalCollegeStudents += totalDeptStudents;
      totalCollegeAssigned += deptAssignedStudents;
      totalCollegeCapacity += deptCapacity;

      return {
        id: `dept-${d.id}`,
        rawId: d.id,
        type: 'DEPARTMENT',
        code: d.code,
        name: d.name,
        description: d.description,
        hod: d.hod
          ? {
              id: `hod-${d.hod.id}`,
              rawId: d.hod.id,
              type: 'HOD',
              name: d.hod.name,
              email: d.hod.email,
              phone: d.hod.phone,
            }
          : null,
        facultyCount: d.facultyMembers.length,
        studentCount: totalDeptStudents,
        assignedCount: deptAssignedStudents,
        unassignedCount: unassignedStudents.length,
        totalCapacity: deptCapacity,
        utilization: deptCapacity > 0 ? Math.round((deptAssignedStudents / deptCapacity) * 100) : 0,
        facultyMembers: facultyNodes,
        unassignedStudents,
      };
    });

    const hierarchyTree = {
      id: 'root-dean',
      type: 'DEAN',
      name: deanUser?.name || 'Dr. Arthur Pendelton',
      title: 'Dean of Academic Affairs',
      email: deanUser?.email || 'dean@college.edu',
      phone: deanUser?.phone || '+1 (555) 000-1111',
      totalDepartments: departmentNodes.length,
      totalFaculty: totalCollegeFaculty,
      totalStudents: totalCollegeStudents,
      totalAssigned: totalCollegeAssigned,
      totalUnassigned: totalCollegeStudents - totalCollegeAssigned,
      totalCapacity: totalCollegeCapacity,
      overallUtilization: totalCollegeCapacity > 0 ? Math.round((totalCollegeAssigned / totalCollegeCapacity) * 100) : 0,
      departments: departmentNodes,
    };

    return res.status(200).json({ success: true, hierarchy: hierarchyTree });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to construct hierarchy tree', error: error.message });
  }
}

export async function searchHierarchy(req: AuthRequest, res: Response) {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query parameter q is required' });
    }

    const [departments, facultyMembers, students] = await Promise.all([
      prisma.department.findMany({
        where: {
          OR: [
            { code: { contains: query } },
            { name: { contains: query } },
          ],
        },
        include: { hod: { select: { name: true, email: true } } },
      }),
      prisma.faculty.findMany({
        where: {
          OR: [
            { facultyCode: { contains: query } },
            { designation: { contains: query } },
            { user: { name: { contains: query } } },
          ],
        },
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { id: true, code: true, name: true } },
          _count: { select: { students: true } },
        },
      }),
      prisma.student.findMany({
        where: {
          OR: [
            { studentId: { contains: query } },
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        take: 30,
        include: {
          department: { select: { code: true, name: true } },
          faculty: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      results: {
        departments: departments.map((d) => ({
          type: 'DEPARTMENT',
          id: d.id,
          code: d.code,
          name: d.name,
          hod: d.hod?.name,
          path: `Dean > ${d.name} (${d.code})`,
        })),
        faculty: facultyMembers.map((f) => ({
          type: 'FACULTY',
          id: f.id,
          code: f.facultyCode,
          name: f.user.name,
          department: f.department.code,
          studentsCount: f._count.students,
          path: `Dean > ${f.department.name} > ${f.user.name} (${f.facultyCode})`,
        })),
        students: students.map((s) => ({
          type: 'STUDENT',
          id: s.id,
          studentId: s.studentId,
          name: s.name,
          department: s.department.code,
          facultyMentor: s.faculty?.user.name || 'Unassigned',
          path: `Dean > ${s.department.name} > ${s.faculty ? s.faculty.user.name : 'Unassigned'} > ${s.name}`,
        })),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Hierarchy search failed', error: error.message });
  }
}
