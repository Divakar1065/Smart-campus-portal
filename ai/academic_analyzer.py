#!/usr/bin/env python3
"""
Academic Progress and Achievement Tracking System (ATS)
Python Statistical & Heuristic Academic Analyzer
"""

import sys
import json

def analyze(data):
    name = data.get("name", "Student")
    marks = data.get("marks", [])
    attendance = data.get("attendance", [])

    weak_subjects = []
    strong_subjects = []
    alerts = []
    recommendations = []

    total_credits = 0
    weighted_points = 0.0

    for m in marks:
        credits = float(m.get("credits", 3))
        score = float(m.get("marks_obtained", 0.0))
        grade_points = float(m.get("grade_points", 0.0))

        if grade_points == 0.0:
            if score >= 90: grade_points = 10.0
            elif score >= 80: grade_points = 9.0
            elif score >= 70: grade_points = 8.0
            elif score >= 60: grade_points = 7.0
            elif score >= 50: grade_points = 6.0
            elif score >= 45: grade_points = 5.0
            else: grade_points = 0.0

        total_credits += credits
        weighted_points += grade_points * credits

        sub_name = m.get("subject_name") or m.get("subject") or f"Subject {m.get('subject_id')}"
        if score < 50 or grade_points < 6.0:
            weak_subjects.append({"subject": sub_name, "score": score})
        elif score >= 80 or grade_points >= 9.0:
            strong_subjects.append({"subject": sub_name, "score": score})

    cgpa = round(weighted_points / total_credits, 2) if total_credits > 0 else 0.0

    total_attended = 0
    total_classes = 0
    low_att_subjects = []

    for a in attendance:
        att = int(a.get("attended_classes", 0))
        tot = int(a.get("total_classes", 0))
        pct = (att * 100.0 / tot) if tot > 0 else float(a.get("percentage", 0.0))

        total_attended += att
        total_classes += tot

        sub_name = a.get("subject_name") or a.get("subject") or f"Subject {a.get('subject_id')}"
        if pct < 75.0:
            low_att_subjects.append({"subject": sub_name, "percentage": round(pct, 1)})

    overall_att = round((total_attended * 100.0 / total_classes), 1) if total_classes > 0 else 0.0

    if overall_att < 75.0 and total_classes > 0:
        alerts.append(f"Critical: Overall attendance is {overall_att}%, below the mandatory 75% cutoff.")

    for item in low_att_subjects:
        alerts.append(f"Attendance Alert: {item['subject']} is at {item['percentage']}%. Minimum 75% required.")

    for item in weak_subjects:
        alerts.append(f"Academic Alert: Low mastery in {item['subject']} ({item['score']}%). Targeted practice advised.")
        recommendations.append(f"Allocate focused study hours to reinforce fundamentals in {item['subject']}.")

    if not weak_subjects and cgpa >= 8.0:
        recommendations.append("Exemplary academic trajectory. Explore undergraduate research and technical competitions.")
    elif cgpa >= 7.0:
        recommendations.append("Solid academic performance. Strive to elevate B+ grades to A in foundational topics.")
    else:
        recommendations.append("Consult with faculty mentors to develop a structured study plan.")

    summary = f"Student {name} holds a credit-weighted GPA of {cgpa} with {overall_att}% attendance."
    if weak_subjects:
        summary += f" Attention required in: {', '.join([w['subject'] for w in weak_subjects])}."
    else:
        summary += " Overall academic standing is very strong."

    return {
        "engine": "python-statistical",
        "studentName": name,
        "cgpa": cgpa,
        "overallAttendance": overall_att,
        "weakSubjects": [w["subject"] for w in weak_subjects],
        "strongSubjects": [s["subject"] for s in strong_subjects],
        "alerts": alerts,
        "recommendations": recommendations,
        "summary": summary
    }

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            sys.exit(0)
        data = json.loads(raw_input)
        result = analyze(data)
        print(json.dumps(result))
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
