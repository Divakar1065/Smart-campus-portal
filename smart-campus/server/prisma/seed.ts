import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Aarav', 'Diya', 'Rohan', 'Ananya', 'Vihaan', 'Ishan', 'Tanvi', 'Aditya',
  'Meera', 'Kabir', 'Sneha', 'Arjun', 'Pooja', 'Siddharth', 'Kavya', 'Rahul',
  'Anushka', 'Varun', 'Rhea', 'Nikhil', 'Shreya', 'Dev', 'Tara', 'Akash',
  'Maya', 'Karan', 'Priya', 'Harsh', 'Isha', 'Vikram', 'Neha', 'Gaurav'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Iyer', 'Sen', 'Reddy', 'Gupta', 'Nair', 'Verma',
  'Menon', 'Joshi', 'Chopra', 'Malhotra', 'Bose', 'Rao', 'Sundaram', 'Mukherjee',
  'Pillai', 'Kulkarni', 'Subramaniam', 'Nambiar', 'Pandey', 'Krishnan', 'Deshmukh', 'Saxena'
];

const DEPARTMENT_SUBJECTS: Record<string, { code: string; name: string; credits: number }[]> = {
  ECE: [
    { code: 'EC401', name: 'Analog Electronic Circuits', credits: 4 },
    { code: 'EC402', name: 'Digital Signal Processing', credits: 4 },
    { code: 'EC403', name: 'Microprocessors and Microcontrollers', credits: 3 },
    { code: 'EC404', name: 'Electromagnetic Fields and Waves', credits: 3 },
    { code: 'EC405', name: 'Signals and Systems Laboratory', credits: 2 },
  ],
  EEE: [
    { code: 'EE401', name: 'Power System Analysis', credits: 4 },
    { code: 'EE402', name: 'Electrical Machines II', credits: 4 },
    { code: 'EE403', name: 'Control Systems Engineering', credits: 3 },
    { code: 'EE404', name: 'Power Electronics and Drives', credits: 4 },
  ],
  CSE: [
    { code: 'CS401', name: 'Design and Analysis of Algorithms', credits: 4 },
    { code: 'CS402', name: 'Database Management Systems', credits: 4 },
    { code: 'CS403', name: 'Operating Systems Principles', credits: 3 },
    { code: 'CS404', name: 'Computer Networks and Protocols', credits: 4 },
    { code: 'CS405', name: 'Software Engineering Laboratory', credits: 2 },
  ],
  IT: [
    { code: 'IT401', name: 'Web Application Development', credits: 4 },
    { code: 'IT402', name: 'Information Security and Cryptography', credits: 4 },
    { code: 'IT403', name: 'Cloud Computing Infrastructure', credits: 3 },
    { code: 'IT404', name: 'Enterprise Database Architectures', credits: 4 },
  ],
  MECH: [
    { code: 'ME401', name: 'Kinematics and Dynamics of Machines', credits: 4 },
    { code: 'ME402', name: 'Fluid Mechanics and Machinery', credits: 4 },
    { code: 'ME403', name: 'Applied Thermodynamics', credits: 3 },
    { code: 'ME404', name: 'CAD/CAM Modeling Laboratory', credits: 2 },
  ],
  CIVIL: [
    { code: 'CE401', name: 'Structural Analysis I', credits: 4 },
    { code: 'CE402', name: 'Geotechnical Engineering', credits: 4 },
    { code: 'CE403', name: 'Hydrology and Water Resources', credits: 3 },
    { code: 'CE404', name: 'Surveying and Geomatics Laboratory', credits: 2 },
  ],
  'AI & DS': [
    { code: 'AD401', name: 'Machine Learning Foundations', credits: 4 },
    { code: 'AD402', name: 'Deep Neural Networks', credits: 4 },
    { code: 'AD403', name: 'Big Data Processing Frameworks', credits: 3 },
    { code: 'AD404', name: 'Artificial Intelligence Ethics and Law', credits: 3 },
  ],
  BME: [
    { code: 'BM401', name: 'Biomedical Instrumentation and Sensors', credits: 4 },
    { code: 'BM402', name: 'Physiological Systems Modeling', credits: 4 },
    { code: 'BM403', name: 'Medical Imaging Techniques', credits: 3 },
    { code: 'BM404', name: 'Biomaterials and Prosthetics', credits: 3 },
  ],
};

async function main() {
  console.log('🌱 Starting Smart Campus Database Seeding...');

  // Clean existing records in correct relation order
  await prisma.notification.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const standardPasswordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Create Dean
  const deanUser = await prisma.user.create({
    data: {
      email: 'dean@college.edu',
      password: standardPasswordHash,
      name: 'Dr. Arthur Vance',
      role: 'DEAN',
      phone: '+91 9876540001',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created Dean:', deanUser.name);

  // 2. Create Administrator
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      password: adminPasswordHash,
      name: 'Central Administration',
      role: 'ADMIN',
      phone: '+91 9876540002',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created Admin:', adminUser.name);

  // 3. Define 8 Academic Departments & HOD details
  const departmentConfigs = [
    {
      code: 'ECE',
      name: 'Electronics and Communication Engineering',
      description: 'VLSI, embedded systems, signal processing and wireless telecommunications.',
      hodName: 'Dr. Rajesh Sharma',
      hodEmail: 'hod.ece@college.edu',
      facultyCount: 2,
    },
    {
      code: 'EEE',
      name: 'Electrical and Electronics Engineering',
      description: 'Power systems, electrical machines, renewable energy and control engineering.',
      hodName: 'Dr. Meenakshi Sundaram',
      hodEmail: 'hod.eee@college.edu',
      facultyCount: 2,
    },
    {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      description: 'Software engineering, algorithms, computer architecture, cloud and cyber security.',
      hodName: 'Dr. Arvind Swaminathan',
      hodEmail: 'hod.cse@college.edu',
      facultyCount: 3, // CSE has 3 faculty members
    },
    {
      code: 'IT',
      name: 'Information Technology',
      description: 'Enterprise information systems, web engineering, database architecture and networking.',
      hodName: 'Dr. Sunita Rao',
      hodEmail: 'hod.it@college.edu',
      facultyCount: 2,
    },
    {
      code: 'MECH',
      name: 'Mechanical Engineering',
      description: 'Thermal engineering, fluid mechanics, CAD/CAM, robotics and manufacturing.',
      hodName: 'Dr. Vikramaditya Kulkarni',
      hodEmail: 'hod.mech@college.edu',
      facultyCount: 2,
    },
    {
      code: 'CIVIL',
      name: 'Civil Engineering',
      description: 'Structural engineering, geotechnical analysis, transportation and urban hydrology.',
      hodName: 'Dr. Ananya Mukherjee',
      hodEmail: 'hod.civil@college.edu',
      facultyCount: 2,
    },
    {
      code: 'AI & DS',
      name: 'Artificial Intelligence and Data Science',
      description: 'Machine learning, deep neural networks, computer vision and big data analytics.',
      hodName: 'Dr. Karthik Subramaniam',
      hodEmail: 'hod.aids@college.edu',
      facultyCount: 2,
    },
    {
      code: 'BME',
      name: 'Biomedical Engineering',
      description: 'Biomedical instrumentation, physiological modeling, medical imaging and prosthetics.',
      hodName: 'Dr. Deepa Nambiar',
      hodEmail: 'hod.bme@college.edu',
      facultyCount: 2,
    },
  ];

  const facultyMembersList: { id: number; facultyCode: string; departmentId: number; name: string }[] = [];
  let studentCounter = 1;

  // Primary Demo Student User
  const demoStudentUser = await prisma.user.create({
    data: {
      email: 'student@college.edu',
      password: standardPasswordHash,
      name: 'Aarav Sharma',
      role: 'STUDENT',
      phone: '+91 9123450001',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created Primary Demo Student User:', demoStudentUser.email);

  // 4. Create Departments, HODs, Faculty, Subjects and Students
  for (const deptConfig of departmentConfigs) {
    // A. Create HOD User account
    const hodUser = await prisma.user.create({
      data: {
        email: deptConfig.hodEmail,
        password: standardPasswordHash,
        name: deptConfig.hodName,
        role: 'HOD',
        phone: `+91 98765${(1000 + departmentConfigs.indexOf(deptConfig)).toString().slice(1)}0`,
        status: 'ACTIVE',
      },
    });

    // B. Create Department with HOD assigned
    const department = await prisma.department.create({
      data: {
        code: deptConfig.code,
        name: deptConfig.name,
        description: deptConfig.description,
        hodId: hodUser.id,
        status: 'ACTIVE',
      },
    });

    console.log(`🏛️ Department [${department.code}] created with HOD: ${deptConfig.hodName}`);

    // C. Seed Department Subjects
    const subjects = DEPARTMENT_SUBJECTS[deptConfig.code] || [];
    for (const sub of subjects) {
      await prisma.subject.create({
        data: {
          code: sub.code,
          name: sub.name,
          credits: sub.credits,
          semester: 4,
          departmentId: department.id,
        },
      });
    }

    // D. Create Faculty Members for this Department
    // Faculty 1 is also the HOD teaching staff member
    const hodFaculty = await prisma.faculty.create({
      data: {
        facultyCode: `FAC-${deptConfig.code.replace(/\s+/g, '')}-001`,
        userId: hodUser.id,
        departmentId: department.id,
        designation: 'Professor & HOD',
        subjectsTaught: `${deptConfig.code} Core Engineering, Advanced Systems`,
        maxCapacity: 35,
        status: 'ACTIVE',
      },
    });
    facultyMembersList.push({
      id: hodFaculty.id,
      facultyCode: hodFaculty.facultyCode,
      departmentId: department.id,
      name: deptConfig.hodName,
    });

    // Additional faculty members for this department
    const additionalFacultyCount = deptConfig.facultyCount - 1;
    const secondaryNames = [
      { name: `Prof. Priya ${LAST_NAMES[departmentConfigs.indexOf(deptConfig) % LAST_NAMES.length]}`, designation: 'Associate Professor' },
      { name: `Prof. Rakesh ${LAST_NAMES[(departmentConfigs.indexOf(deptConfig) + 5) % LAST_NAMES.length]}`, designation: 'Assistant Professor' },
    ];

    for (let fIdx = 0; fIdx < additionalFacultyCount; fIdx++) {
      const fInfo = secondaryNames[fIdx];
      const fEmail = `faculty.${deptConfig.code.toLowerCase().replace(/[^a-z]/g, '')}${fIdx + 2}@college.edu`;

      const fUser = await prisma.user.create({
        data: {
          email: fEmail,
          password: standardPasswordHash,
          name: fInfo.name,
          role: 'FACULTY',
          phone: `+91 98765${(2000 + facultyMembersList.length).toString().slice(1)}1`,
          status: 'ACTIVE',
        },
      });

      const facultyRecord = await prisma.faculty.create({
        data: {
          facultyCode: `FAC-${deptConfig.code.replace(/\s+/g, '')}-00${fIdx + 2}`,
          userId: fUser.id,
          departmentId: department.id,
          designation: fInfo.designation,
          subjectsTaught: `Laboratory & Specialized ${deptConfig.code} Design`,
          maxCapacity: 35,
          status: 'ACTIVE',
        },
      });

      facultyMembersList.push({
        id: facultyRecord.id,
        facultyCode: facultyRecord.facultyCode,
        departmentId: department.id,
        name: fInfo.name,
      });
    }

    // E. Create 32 Assigned Students for EACH faculty member in this department
    const deptFacultyList = facultyMembersList.filter(f => f.departmentId === department.id);
    for (const faculty of deptFacultyList) {
      for (let sIdx = 1; sIdx <= 32; sIdx++) {
        const isFirstStudentOverall = studentCounter === 1;
        const fn = isFirstStudentOverall ? 'Aarav' : FIRST_NAMES[(studentCounter * 3 + sIdx) % FIRST_NAMES.length];
        const ln = isFirstStudentOverall ? 'Sharma' : LAST_NAMES[(studentCounter * 7 + sIdx) % LAST_NAMES.length];
        const studentName = `${fn} ${ln}`;
        const codeClean = deptConfig.code.replace(/[^A-Z]/g, '');
        const studentId = `${codeClean}2026${studentCounter.toString().padStart(3, '0')}`;
        const email = isFirstStudentOverall ? 'student@college.edu' : `${fn.toLowerCase()}.${ln.toLowerCase()}.${studentCounter}@student.college.edu`;

        let linkedUserId: number | null = null;
        if (isFirstStudentOverall) {
          linkedUserId = demoStudentUser.id;
        } else {
          // Create User account so every student can log in
          const stuUser = await prisma.user.create({
            data: {
              email,
              password: standardPasswordHash,
              name: studentName,
              role: 'STUDENT',
              phone: `+91 91234${(5000 + studentCounter).toString().padStart(5, '0')}`,
              status: 'ACTIVE',
            },
          });
          linkedUserId = stuUser.id;
        }

        await prisma.student.create({
          data: {
            studentId,
            userId: linkedUserId,
            name: studentName,
            email,
            phone: `+91 91234${(5000 + studentCounter).toString().padStart(5, '0')}`,
            departmentId: department.id,
            facultyId: faculty.id,
            academicYear: '2024-2028',
            semester: 4,
            section: sIdx % 2 === 0 ? 'A' : 'B',
            status: 'ACTIVE',
          },
        });
        studentCounter++;
      }
    }

    // F. Add 2 Unassigned Students awaiting allocation in this department
    for (let uIdx = 1; uIdx <= 2; uIdx++) {
      const fn = FIRST_NAMES[(studentCounter * 5) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(studentCounter * 11) % LAST_NAMES.length];
      const codeClean = deptConfig.code.replace(/[^A-Z]/g, '');
      const studentId = `${codeClean}2026${studentCounter.toString().padStart(3, '0')}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${studentCounter}@student.college.edu`;

      const unassignedUser = await prisma.user.create({
        data: {
          email,
          password: standardPasswordHash,
          name: `${fn} ${ln}`,
          role: 'STUDENT',
          phone: `+91 91234${(6000 + studentCounter).toString().padStart(5, '0')}`,
          status: 'ACTIVE',
        },
      });

      await prisma.student.create({
        data: {
          studentId,
          userId: unassignedUser.id,
          name: `${fn} ${ln}`,
          email,
          phone: `+91 91234${(6000 + studentCounter).toString().padStart(5, '0')}`,
          departmentId: department.id,
          facultyId: null, // UNASSIGNED!
          academicYear: '2024-2028',
          semester: 4,
          section: 'A',
          status: 'ACTIVE',
        },
      });
      studentCounter++;
    }
  }

  // 5. Institutional Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Academic Session 2026-2027 Calendar Released',
        message: 'The academic senate has published the complete semester examination, internal assessment, and holiday calendar.',
        sender: "Dean's Office",
        targetRole: 'ALL',
      },
      {
        title: 'Midterm Internal Assessment Submission Window',
        message: 'Faculty members are reminded to finalize internal continuous evaluation grades and review mentor meeting notes.',
        sender: 'Academic Affairs',
        targetRole: 'FACULTY',
      },
      {
        title: 'Mandatory Student Mentorship Check-in',
        message: 'All undergraduate students must complete their Semester 4 progress review with their designated faculty mentor by Friday.',
        sender: 'Office of the Dean of Academic Affairs',
        targetRole: 'STUDENT',
      },
      {
        title: 'Quarterly Departmental Allocation & Workload Review',
        message: 'All HODs are requested to verify student-mentor ratios and confirm no faculty member exceeds the 35-student threshold.',
        sender: 'Central Administration',
        targetRole: 'HOD',
      },
    ],
  });

  // 6. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'COLLEGE_HIERARCHY',
      entityId: 'ROOT',
      details: 'Deterministic seeding completed: 1 Dean, 8 Departments, 8 HODs, 17 Faculty members, 560 Students (with Student Portal accounts).',
    },
  });

  const totalUsers = await prisma.user.count();
  const totalDepts = await prisma.department.count();
  const totalFaculty = await prisma.faculty.count();
  const totalStudents = await prisma.student.count();
  const totalSubjects = await prisma.subject.count();
  const totalNotifications = await prisma.notification.count();
  const unassignedStudents = await prisma.student.count({ where: { facultyId: null } });

  console.log('\n======================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log(`👨‍💼 Users Created:        ${totalUsers} (1 Dean, 1 Admin, 8 HODs, 17 Faculty, 560 Students)`);
  console.log(`🏛️ Departments Created:  ${totalDepts} (ECE, EEE, CSE, IT, MECH, CIVIL, AI & DS, BME)`);
  console.log(`👨‍🏫 Faculty Profiles:    ${totalFaculty} (Distributed across 8 departments)`);
  console.log(`🎓 Total Students:       ${totalStudents} (544 Assigned + ${unassignedStudents} Unassigned)`);
  console.log(`📚 Academic Subjects:    ${totalSubjects} courses across 8 departments`);
  console.log(`📢 Notifications:        ${totalNotifications} active institutional broadcasts`);
  console.log(`⚖️ Average per Faculty:  ~32 students (Max Capacity: 35)`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
