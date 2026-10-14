/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Interactive Frontend Client & Visual Analytics
 */

let marksChartInstance = null;
let attendanceChartInstance = null;
let cachedDashboardData = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoad();
    initSearchFilter();
});

function checkAuthAndLoad() {
    const token = localStorage.getItem('ats_token');
    const userJson = localStorage.getItem('ats_user');

    if (!token || !userJson) {
        // Redirect to login page if unauthenticated
        window.location.href = '/login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(userJson);
    } catch (e) {
        logout();
        return;
    }

    initNavbar(user);
    initSidebar(user.role);

    if (user.isOfflineDemo) {
        const demoBanner = document.getElementById('demoModeBanner');
        if (demoBanner) demoBanner.style.display = 'flex';
    }

    if (user.role === 'admin') {
        switchView('admin');
        loadAdminDashboard(token);
    } else if (user.role === 'faculty') {
        switchView('faculty');
        loadFacultyDashboard(token);
    } else {
        switchView('dashboard');
        loadDashboardData(token);
    }
}

function initNavbar(user) {
    const role = (user.role || 'student').toLowerCase();
    const nameEl = document.getElementById('navProfileName');
    const roleEl = document.getElementById('navProfileRole');

    if (nameEl) {
        nameEl.innerText = user.name || user.username || 'User';
    }
    if (roleEl) {
        if (role === 'admin') {
            roleEl.innerText = 'Administrator';
        } else if (role === 'faculty') {
            roleEl.innerText = 'Faculty Member';
        } else {
            roleEl.innerText = `${user.register_no || 'Student'} (Sem ${user.semester || 1})`;
        }
    }
}

function initSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    if (role === 'admin') {
        nav.innerHTML = `
            <li class="active" onclick="switchView('admin')">
                <i class="fa-solid fa-shield-halved"></i>
                Admin Portal
            </li>
            <li onclick="switchView('ai')">
                <i class="fa-solid fa-robot"></i>
                AI Diagnostics
            </li>
        `;
    } else if (role === 'faculty') {
        nav.innerHTML = `
            <li class="active" onclick="switchView('faculty')">
                <i class="fa-solid fa-chalkboard-user"></i>
                Faculty Portal
            </li>
            <li onclick="switchView('ai')">
                <i class="fa-solid fa-robot"></i>
                AI Diagnostics
            </li>
        `;
    } else {
        nav.innerHTML = `
            <li class="active" onclick="switchView('dashboard')">
                <i class="fa-solid fa-house"></i>
                Dashboard
            </li>
            <li onclick="switchView('profile')">
                <i class="fa-solid fa-user-graduate"></i>
                Student Profile
            </li>
            <li onclick="switchView('subjects')">
                <i class="fa-solid fa-book"></i>
                Coursework
            </li>
            <li onclick="switchView('ai')">
                <i class="fa-solid fa-robot"></i>
                AI Analysis
            </li>
        `;
    }
}

async function loadDashboardData(token) {
    try {
        const response = await fetch('/api/student/dashboard', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.status === 503) {
            showDatabaseUnavailableError();
            return;
        }

        const data = await response.json();
        if (data.success) {
            cachedDashboardData = data;
            renderDashboard(data);
        } else {
            console.error('Failed to load dashboard:', data.message);
        }
    } catch (err) {
        console.error('Network error loading dashboard:', err);
        showDatabaseUnavailableError();
    }
}

async function loadAdminDashboard(token) {
    try {
        const [summaryRes, atRiskRes] = await Promise.all([
            fetch('/api/dashboard/admin/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/admin/at-risk', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (summaryRes.status === 401 || atRiskRes.status === 401) {
            logout();
            return;
        }

        if (summaryRes.status === 503 || atRiskRes.status === 503) {
            showDatabaseUnavailableError();
            return;
        }

        const summaryData = await summaryRes.json();
        const atRiskData = await atRiskRes.json();

        if (summaryData.success) {
            const overview = summaryData.overview || {};
            const totalStudentsEl = document.getElementById('adminTotalStudents');
            if (totalStudentsEl) totalStudentsEl.innerText = overview.totalStudents !== undefined ? overview.totalStudents : '--';

            const totalDeptsEl = document.getElementById('adminTotalDepts');
            if (totalDeptsEl) totalDeptsEl.innerText = overview.totalDepartments !== undefined ? overview.totalDepartments : '--';

            const avgGpaEl = document.getElementById('adminAvgGpa');
            if (avgGpaEl) avgGpaEl.innerText = overview.averageCgpa !== undefined ? Number(overview.averageCgpa).toFixed(2) : '--';

            const atRiskCountEl = document.getElementById('adminAtRiskCount');
            if (atRiskCountEl) atRiskCountEl.innerText = overview.atRiskCount !== undefined ? overview.atRiskCount : (atRiskData.totalAtRisk || 0);
        }

        const tbody = document.getElementById('adminAtRiskTableBody');
        if (tbody) {
            const students = atRiskData.students || [];
            if (students.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #10b981; font-weight: 500;">No at-risk students identified. Campus academic health is optimal!</td></tr>';
            } else {
                tbody.innerHTML = students.map(s => {
                    const att = Number(s.overall_attendance || 0);
                    const attColor = att < 75 ? '#dc2626' : '#10b981';
                    const cgpa = Number(s.cgpa || 0);
                    const risks = s.riskFactors && s.riskFactors.length > 0 ? s.riskFactors.join(', ') : 'Academic Alert';
                    return `
                        <tr>
                            <td><strong>${s.register_no || '--'}</strong></td>
                            <td>${s.name || '--'}</td>
                            <td>${s.dept_code || '--'}</td>
                            <td>Semester ${s.current_semester || 1}</td>
                            <td style="color: ${attColor}; font-weight: 600;">${att}%</td>
                            <td><strong>${cgpa.toFixed(2)}</strong></td>
                            <td><span class="badge ${att < 75 ? 'badge-warning' : 'badge-danger'}">${risks}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        showDatabaseUnavailableError();
    }
}

async function loadFacultyDashboard(token) {
    try {
        const [subRes, rosterRes] = await Promise.all([
            fetch('/api/faculty/subjects', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/faculty/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (subRes.status === 401 || rosterRes.status === 401) {
            logout();
            return;
        }

        if (subRes.status === 503 || rosterRes.status === 503) {
            showDatabaseUnavailableError();
            return;
        }

        const subData = await subRes.json();
        const rosterData = await rosterRes.json();

        // Populate Assigned Subjects
        const subTbody = document.getElementById('facultySubjectsTableBody');
        if (subTbody && subData.success) {
            const subjects = subData.subjects || [];
            if (subjects.length === 0) {
                subTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No subjects assigned currently.</td></tr>';
            } else {
                subTbody.innerHTML = subjects.map(s => `
                    <tr>
                        <td><strong>${s.subject_code}</strong></td>
                        <td>${s.subject_name}</td>
                        <td>${s.dept_code || s.dept_name || '--'}</td>
                        <td>Semester ${s.semester}</td>
                        <td>${s.credits} Credits</td>
                        <td><span class="badge badge-success">${s.enrolled_students || 0} Students</span></td>
                    </tr>
                `).join('');
            }
        }

        // Populate Student Roster
        const rosterTbody = document.getElementById('facultyRosterTableBody');
        if (rosterTbody && rosterData.success) {
            const roster = rosterData.roster || [];
            if (roster.length === 0) {
                rosterTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6b7280;">No enrolled students found.</td></tr>';
            } else {
                rosterTbody.innerHTML = roster.map(st => {
                    const att = Number(st.attendance_pct || 0);
                    const attColor = att < 75 ? '#dc2626' : '#10b981';
                    const gpa = Number(st.current_gpa || 0);
                    return `
                        <tr>
                            <td><strong>${st.register_no}</strong></td>
                            <td>${st.name}</td>
                            <td>${st.dept_code || '--'}</td>
                            <td>Semester ${st.current_semester}</td>
                            <td style="color: ${attColor}; font-weight: 600;">${att}%</td>
                            <td><strong>${gpa.toFixed(2)}</strong></td>
                            <td><span class="badge ${st.isAtRisk ? 'badge-warning' : 'badge-success'}">${st.isAtRisk ? 'At Risk' : 'Good Standing'}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Error loading faculty dashboard:', err);
        showDatabaseUnavailableError();
    }
}

function showDatabaseUnavailableError() {
    const welcome = document.getElementById('welcomeGreeting');
    if (welcome) {
        welcome.innerHTML = '⚠️ Cloud Database Unavailable';
    }
    const sub = document.getElementById('welcomeSub');
    if (sub) {
        sub.innerHTML = 'Could not establish connection to Aiven Cloud MySQL. Please verify DB credentials in .env.';
    }

    const errorRow7 = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #dc2626; font-weight: 500;"><i class="fa-solid fa-triangle-exclamation"></i> Cloud Database Unavailable. Configure Aiven MySQL credentials in .env.</td></tr>';
    const errorRow6 = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #dc2626; font-weight: 500;"><i class="fa-solid fa-triangle-exclamation"></i> Cloud Database Unavailable. Configure Aiven MySQL credentials in .env.</td></tr>';

    const subjectsTbody = document.getElementById('subjectsTableBody');
    if (subjectsTbody) subjectsTbody.innerHTML = errorRow7;

    const adminTbody = document.getElementById('adminAtRiskTableBody');
    if (adminTbody) adminTbody.innerHTML = errorRow7;

    const facultySubTbody = document.getElementById('facultySubjectsTableBody');
    if (facultySubTbody) facultySubTbody.innerHTML = errorRow6;

    const facultyRosterTbody = document.getElementById('facultyRosterTableBody');
    if (facultyRosterTbody) facultyRosterTbody.innerHTML = errorRow7;

    const achList = document.getElementById('achievementsList');
    if (achList) achList.innerHTML = '<p style="color: #dc2626; font-size: 13px;"><i class="fa-solid fa-circle-exclamation"></i> Database offline. Unable to load records.</p>';

    const aiList = document.getElementById('aiRecommendationsList');
    if (aiList) aiList.innerHTML = '<div class="alert-item"><i class="fa-solid fa-triangle-exclamation"></i> Cloud database disconnected. Configure .env with valid Aiven credentials to load data.</div>';
}

function renderDashboard(data) {
    const { profile, metrics, performance, attendanceSummary, achievements, aiRecommendation } = data;

    // 1. User Header & Profile
    const firstName = profile.name ? profile.name.split(' ')[0] : 'Student';
    document.getElementById('welcomeGreeting').innerText = `Hello ${firstName} 👋`;
    document.getElementById('welcomeSub').innerText = `Academic Progress & Achievement Tracking System | ${profile.department || 'Engineering'}`;

    document.getElementById('navProfileName').innerText = profile.name || 'Student';
    document.getElementById('navProfileRole').innerText = `${profile.register_no} (Sem ${profile.semester})`;
    if (profile.avatar_url) {
        document.getElementById('navProfileImg').src = profile.avatar_url;
        document.getElementById('profileDetailImg').src = profile.avatar_url;
    }

    // 2. Metrics Cards
    document.getElementById('cardGpa').innerText = metrics.gpa ? Number(metrics.gpa).toFixed(2) : '0.00';
    document.getElementById('cardAttendance').innerText = `${metrics.attendance || 0}%`;
    document.getElementById('cardSubjects').innerText = `${performance.length} Subjects`;
    document.getElementById('cardAchievements').innerText = metrics.achievements || 0;

    const gpaBadge = document.getElementById('gpaBadge');
    if (gpaBadge) gpaBadge.innerText = `CGPA: ${metrics.gpa}`;

    const attBadge = document.getElementById('attEligibilityBadge');
    if (attBadge) {
        if (metrics.attendance >= 75) {
            attBadge.className = 'badge badge-success';
            attBadge.innerText = 'Exam Eligible';
        } else {
            attBadge.className = 'badge badge-warning';
            attBadge.innerText = 'Attendance Alert';
        }
    }

    // 3. Render Visual Charts
    renderMarksChart(performance);
    renderAttendanceChart(attendanceSummary, metrics.attendance);

    // 4. Render AI Recommendations & Alerts
    renderAIInsights(aiRecommendation);

    // 5. Render Achievements
    renderAchievementsList(achievements);

    // 6. Populate Detail Views
    renderSubjectsTable(performance, attendanceSummary);
    renderProfileView(profile);
    renderAIDetailedView(aiRecommendation);
}

function renderMarksChart(performance) {
    const ctx = document.getElementById('marksChart').getContext('2d');
    if (marksChartInstance) {
        marksChartInstance.destroy();
    }

    const labels = performance.map(p => p.subject);
    const scores = performance.map(p => p.marks);

    marksChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marks Obtained',
                data: scores,
                backgroundColor: scores.map(s => s >= 80 ? '#4f46e5' : s >= 60 ? '#818cf8' : '#f87171'),
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const item = performance[context.dataIndex];
                            return `Grade: ${item.grade} (${item.credits} Credits)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#f3f4f6' },
                    ticks: { font: { family: 'Poppins', size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        maxRotation: 25,
                        minRotation: 0
                    }
                }
            }
        }
    });
}

function renderAttendanceChart(attendanceSummary, overallPct) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    let totalAttended = 0;
    let totalClasses = 0;
    attendanceSummary.forEach(a => {
        totalAttended += Number(a.attended || 0);
        totalClasses += Number(a.total || 0);
    });
    const missedClasses = Math.max(0, totalClasses - totalAttended);

    attendanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Attended Classes', 'Absent Classes'],
            datasets: [{
                data: [totalAttended, missedClasses],
                backgroundColor: ['#10b981', '#fecaca'],
                hoverBackgroundColor: ['#059669', '#f87171'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Poppins', size: 11 }, boxWidth: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const pct = totalClasses > 0 ? ((val / totalClasses) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderAIInsights(ai) {
    const container = document.getElementById('aiRecommendationsList');
    if (!container || !ai) return;

    let html = '';

    if (ai.alerts && ai.alerts.length > 0) {
        ai.alerts.forEach(alert => {
            html += `<div class="alert-item"><i class="fa-solid fa-triangle-exclamation"></i> ${alert}</div>`;
        });
    }

    if (ai.recommendations && ai.recommendations.length > 0) {
        ai.recommendations.forEach(rec => {
            html += `<div class="recommendation-item"><i class="fa-solid fa-lightbulb"></i> ${rec}</div>`;
        });
    }

    if (!html) {
        html = '<p style="color: #6b7280; font-size: 13px;">No critical alerts. Maintain consistent study schedules.</p>';
    }

    container.innerHTML = html;
}

function renderAchievementsList(achievements) {
    const container = document.getElementById('achievementsList');
    if (!container || !achievements) return;

    if (achievements.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-size: 13px;">No achievements recorded yet.</p>';
        return;
    }

    let html = '';
    achievements.slice(0, 5).forEach(ach => {
        const iconClass = ach.category === 'technical' ? 'fa-code' :
                          ach.category === 'sports' ? 'fa-medal' :
                          ach.category === 'leadership' ? 'fa-users' : 'fa-graduation-cap';
        html += `
            <div class="event-item">
                <div class="event-icon"><i class="fa-solid ${iconClass}"></i></div>
                <div class="event-content">
                    <h5>${ach.title}</h5>
                    <p>${ach.category.toUpperCase()} • ${ach.achievement_date || '2026'}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderSubjectsTable(performance, attendanceSummary) {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;

    const attMap = {};
    (attendanceSummary || []).forEach(a => {
        attMap[a.subject] = a.percentage;
    });

    let html = '';
    performance.forEach(p => {
        const attPct = attMap[p.subject] !== undefined ? attMap[p.subject] : '--';
        const attColor = Number(attPct) >= 75 ? '#10b981' : '#ef4444';
        html += `
            <tr>
                <td><strong>${p.code || '--'}</strong></td>
                <td>${p.subject}</td>
                <td>${p.credits || 3}</td>
                <td><strong>${p.marks} / ${p.maxMarks || 100}</strong></td>
                <td><span class="badge ${p.marks >= 80 ? 'badge-success' : ''}">${p.grade || '--'}</span></td>
                <td>${(p.marks >= 90 ? 10 : p.marks >= 80 ? 9 : p.marks >= 70 ? 8 : p.marks >= 60 ? 7 : 6).toFixed(1)}</td>
                <td style="color: ${attColor}; font-weight: 600;">${attPct}%</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function renderProfileView(profile) {
    document.getElementById('profileDetailName').innerText = profile.name || '--';
    document.getElementById('profileDetailReg').innerText = `Register No: ${profile.register_no || '--'}`;
    document.getElementById('profileDetailDept').innerText = profile.department || '--';
    document.getElementById('profileDetailSem').innerText = `Semester ${profile.semester || 1}`;
    document.getElementById('profileDetailSec').innerText = `Section ${profile.section || 'A'}`;
    document.getElementById('profileDetailEmail').innerText = profile.email || 'student@college.edu';
    document.getElementById('profileDetailCgpa').innerText = profile.cgpa ? Number(profile.cgpa).toFixed(2) : '--';
    document.getElementById('profileDetailAtt').innerText = `${profile.overallAttendance || '--'}%`;
}

function renderAIDetailedView(ai) {
    const strengthsEl = document.getElementById('aiStrengthsList');
    const weakEl = document.getElementById('aiWeaknessesList');

    if (!ai) {
        if (strengthsEl) strengthsEl.innerHTML = '<li><i class="fa-solid fa-brain" style="color:#4f46e5; margin-right:8px;"></i> Institutional AI heuristics active across all student cohorts.</li>';
        if (weakEl) weakEl.innerHTML = '<li><i class="fa-solid fa-triangle-exclamation" style="color:#dc2626; margin-right:8px;"></i> Early-warning intervention model monitoring attendance (&lt;75%) and GPA (&lt;6.0).</li>';
        return;
    }

    if (strengthsEl && ai.strongSubjects) {
        strengthsEl.innerHTML = ai.strongSubjects.length > 0
            ? ai.strongSubjects.map(s => `<li><i class="fa-solid fa-check" style="color:#16a34a; margin-right:8px;"></i> ${s} (High Mastery)</li>`).join('')
            : '<li>Consistent performance across core subjects.</li>';
    }

    if (weakEl && ai.weakSubjects) {
        weakEl.innerHTML = ai.weakSubjects.length > 0
            ? ai.weakSubjects.map(w => `<li><i class="fa-solid fa-triangle-exclamation" style="color:#dc2626; margin-right:8px;"></i> ${w} (Target for Revision)</li>`).join('')
            : '<li>No critical subject weaknesses detected! Keep maintaining your current GPA.</li>';
    }
}

// Navigation between views
function switchView(viewName) {
    const targetKey = viewName.toLowerCase();
    const allPanels = document.querySelectorAll('.view-panel');
    allPanels.forEach(p => {
        if (p.id.toLowerCase() === `view${targetKey}`) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });

    // Update active class on sidebar items
    const navItems = document.querySelectorAll('.sidebar li');
    navItems.forEach(item => {
        const itemOnClick = item.getAttribute('onclick') || '';
        if (itemOnClick.toLowerCase().includes(`'${targetKey}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function initSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activePanel = document.querySelector('.view-panel.active');
        if (!activePanel) return;

        const rows = activePanel.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// Academic Chatbot Functions
function toggleChat() {
    const modal = document.getElementById('chatModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        document.getElementById('chatInput').focus();
    }
}

function handleChatEnter(e) {
    if (e.key === 'Enter') {
        sendChat();
    }
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const messagesContainer = document.getElementById('chatMessages');

    // Append User Message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.innerText = message;
    messagesContainer.appendChild(userBubble);
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const token = localStorage.getItem('ats_token');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble chat-bubble-bot';
        botBubble.innerText = data.reply || 'Sorry, I could not process your query.';
        messagesContainer.appendChild(botBubble);
    } catch (err) {
        const errorBubble = document.createElement('div');
        errorBubble.className = 'chat-bubble chat-bubble-bot';
        errorBubble.innerText = '⚠️ Network error: Could not reach academic chatbot.';
        messagesContainer.appendChild(errorBubble);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function logout() {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
    window.location.href = '/login.html';
}