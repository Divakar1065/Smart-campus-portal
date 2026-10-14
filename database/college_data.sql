-- =====================================================================
-- Academic Progress and Achievement Tracking System (ATS)
-- Idempotent Seed & College Reference Data
-- Compatible with Aiven Cloud MySQL (defaultdb or custom db)
-- =====================================================================

-- 1. Departments Seed Data
INSERT INTO departments (id, dept_code, dept_name) VALUES
(1, 'CSE', 'Computer Science & Engineering'),
(2, 'ECE', 'Electronics & Communication Engineering'),
(3, 'IT', 'Information Technology'),
(4, 'MECH', 'Mechanical Engineering')
ON DUPLICATE KEY UPDATE dept_name = VALUES(dept_name);

-- 2. Users Seed Data
-- Passwords will be verified/updated by migrate.js if needed.
-- Standard demo password is 'Password123!' (admin is 'AdminPassword123!')
INSERT INTO users (id, username, email, password_hash, role) VALUES
(1, 'ishita_sharma', 'ishita.sharma@college.edu', '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', 'student'),
(2, 'arun_kumar', 'arun.kumar@college.edu', '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', 'student'),
(3, 'prof_ramesh', 'ramesh.faculty@college.edu', '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', 'faculty'),
(4, 'admin_principal', 'admin@college.edu', '$2a$10$9Z8v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', 'admin')
ON DUPLICATE KEY UPDATE email = VALUES(email), role = VALUES(role);

-- 3. Students Seed Data
INSERT INTO students (id, user_id, register_no, name, dept_id, current_semester, section, email, phone, avatar_url) VALUES
(1, 1, '2024CS101', 'Ishita Sharma', 1, 4, 'A', 'ishita.sharma@college.edu', '+91 9876543210', 'https://i.pravatar.cc/150?u=ishita'),
(2, 2, '2024CS102', 'Arun Kumar', 1, 4, 'A', 'arun.kumar@college.edu', '+91 9876543211', 'https://i.pravatar.cc/150?u=arun')
ON DUPLICATE KEY UPDATE name = VALUES(name), current_semester = VALUES(current_semester);

-- 4. Subjects Seed Data (Semester 4 Computer Science & Engineering)
INSERT INTO subjects (id, subject_code, subject_name, dept_id, semester, credits) VALUES
(1, 'CS401', 'Mathematics IV', 1, 4, 4),
(2, 'CS402', 'Data Structures & Algorithms', 1, 4, 4),
(3, 'CS403', 'Python Programming', 1, 4, 3),
(4, 'CS404', 'Database Management Systems', 1, 4, 3),
(5, 'CS405', 'Operating Systems', 1, 4, 3),
(6, 'CS406', 'Technical Communication', 1, 4, 2)
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name), credits = VALUES(credits);

-- 5. Academic Marks Seed Data (Semester 4 End-Semester)
-- Student 1: Ishita Sharma (High-performing student)
INSERT INTO marks (id, student_id, subject_id, semester, exam_type, marks_obtained, max_marks, grade, grade_points) VALUES
(1, 1, 1, 4, 'semester', 84.00, 100.00, 'A', 8.00),
(2, 1, 2, 4, 'semester', 92.00, 100.00, 'O', 10.00),
(3, 1, 3, 4, 'semester', 82.00, 100.00, 'A', 8.00),
(4, 1, 4, 4, 'semester', 86.00, 100.00, 'A+', 9.00),
(5, 1, 5, 4, 'semester', 72.00, 100.00, 'B+', 7.00),
(6, 1, 6, 4, 'semester', 88.00, 100.00, 'A+', 9.00),

-- Student 2: Arun Kumar (At-Risk student for alert validation)
(7, 2, 1, 4, 'semester', 42.00, 100.00, 'F', 0.00),
(8, 2, 2, 4, 'semester', 55.00, 100.00, 'B', 6.00),
(9, 2, 3, 4, 'semester', 64.00, 100.00, 'B+', 7.00),
(10, 2, 4, 4, 'semester', 50.00, 100.00, 'B', 6.00),
(11, 2, 5, 4, 'semester', 38.00, 100.00, 'F', 0.00),
(12, 2, 6, 4, 'semester', 60.00, 100.00, 'B+', 7.00)
ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), grade = VALUES(grade), grade_points = VALUES(grade_points);

-- 6. Attendance Seed Data
-- Student 1: Ishita Sharma
INSERT INTO attendance (id, student_id, subject_id, total_classes, attended_classes, percentage) VALUES
(1, 1, 1, 48, 42, 87.50),
(2, 1, 2, 50, 45, 90.00),
(3, 1, 3, 45, 38, 84.44),
(4, 1, 4, 42, 36, 85.71),
(5, 1, 5, 40, 33, 82.50),
(6, 1, 6, 30, 28, 93.33),

-- Student 2: Arun Kumar (Low attendance in CS401 and CS405)
(7, 2, 1, 48, 28, 58.33),
(8, 2, 2, 50, 38, 76.00),
(9, 2, 3, 45, 36, 80.00),
(10, 2, 4, 42, 32, 76.19),
(11, 2, 5, 40, 24, 60.00),
(12, 2, 6, 30, 23, 76.67)
ON DUPLICATE KEY UPDATE total_classes = VALUES(total_classes), attended_classes = VALUES(attended_classes), percentage = VALUES(percentage);

-- 7. Achievements Seed Data (Ishita Sharma: 6 Verified Achievements)
INSERT INTO achievements (id, student_id, title, category, description, achievement_date, status, verified_by) VALUES
(1, 1, '1st Place - Smart India Hackathon', 'technical', 'Built an automated campus irrigation monitoring platform using IoT.', '2026-03-15', 'verified', 'Dr. S. Raman'),
(2, 1, 'Dean Honor List (Top 1%)', 'academic', 'Secured outstanding semester GPA across Computer Science department.', '2026-01-10', 'verified', 'Dean Academic Affairs'),
(3, 1, 'IEEE Research Paper Publication', 'academic', 'Authored paper on Low-Latency Edge Intelligence for Academic Networks.', '2026-04-02', 'verified', 'Prof. Ramesh'),
(4, 1, 'ACM Inter-College Coding Contest Winner', 'technical', 'Ranked 1st among 120 participating teams in algorithmic problem solving.', '2025-11-20', 'verified', 'HOD Computer Science'),
(5, 1, 'Student Tech Club Lead Coordinator', 'leadership', 'Organized 12 hands-on workshops on Full-Stack Development and AI.', '2026-02-28', 'verified', 'Faculty Advisor'),
(6, 1, 'University Badminton Tournament Runner-Up', 'sports', 'Represented the university department at the inter-collegiate sports meet.', '2025-12-18', 'verified', 'Director of Physical Education')
ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status);

-- 8. Semesters Seed Data
INSERT INTO semesters (id, semester_number, academic_year, is_current) VALUES
(1, 1, '2024-2025', FALSE),
(2, 2, '2024-2025', FALSE),
(3, 3, '2025-2026', FALSE),
(4, 4, '2025-2026', TRUE),
(5, 5, '2026-2027', FALSE),
(6, 6, '2026-2027', FALSE),
(7, 7, '2027-2028', FALSE),
(8, 8, '2027-2028', FALSE)
ON DUPLICATE KEY UPDATE academic_year = VALUES(academic_year), is_current = VALUES(is_current);

-- 9. Notifications Seed Data
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
(1, 1, 'Examination Schedule Published', 'Semester 4 final examination timetable is now available.', 'info', FALSE),
(2, 1, 'Academic Honors Alert', 'Congratulations on securing Dean Honor List for outstanding GPA.', 'achievement', TRUE),
(3, 2, 'Attendance Warning Alert', 'Attendance in CS401 and CS405 is below 75%. Please meet your faculty advisor.', 'warning', FALSE)
ON DUPLICATE KEY UPDATE title = VALUES(title), message = VALUES(message);

