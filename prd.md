 # Product Requirements Document (PRD)
## Assignment & Submission Management System

**Project Type:** Full-stack web application  
**Deadline:** 14 August 2026  
**Tech Stack (as decided):**  
- Frontend: Next.js + React + TypeScript + Tailwind + shadcn/ui  
- Backend: Next.js API Routes (App Router)  
- Database: PostgreSQL  
- Auth: JWT + Role-based access control  
- Validation: Zod  
- Testing: Unit tests for business rules & authorization  

---

## 1. Overview

A role-based school/college application that allows:
- Teachers to create, manage and grade assignments
- Students to view, submit and track assignments
- Admins to manage users, classes/courses, subjects and system settings

---

## 2. User Roles & Permissions

### 2.1 Admin
| Feature | Permission |
|---------|------------|
| Manage Users (Create / Edit / Delete / Activate-Deactivate) | Full |
| Manage Classes / Courses | Full |
| Manage Subjects | Full |
| Assign Teachers to Subjects / Classes | Full |
| View all Assignments | Read |
| View all Submissions | Read |
| Application Settings | Full |
| Dashboard (system-wide stats) | Full |

### 2.2 Teacher
| Feature | Permission |
|---------|------------|
| Create Assignment | Yes |
| Edit / Delete own Assignment | Yes |
| Publish / Unpublish (Draft ↔ Published) | Yes |
| Assign to Class + Subject | Yes |
| Set Title, Description, Deadline, Max Marks | Yes |
| View submissions of own assignments | Yes |
| Give Marks + Feedback | Yes |
| Change submission status (Submitted / Graded / Returned etc.) | Yes |
| View own classes & subjects | Read |

### 2.3 Student
| Feature | Permission |
|---------|------------|
| View assignments of own class/course | Read |
| View assignment details & deadline | Read |
| Submit answer (text / file) | Yes |
| Update submission before deadline | Yes (if allowed) |
| View own submission status | Read |
| View marks & teacher feedback | Read |
| Cannot see other students’ submissions | Restricted |

---

## 3. Core Features

### 3.1 Authentication & Authorization
- Login with Email + Password
- JWT-based authentication
- Role-based route & API protection
- Logout
- Demo accounts for Admin / Teacher / Student

### 3.2 User Management (Admin only)
- CRUD users
- Assign role (Admin / Teacher / Student)
- Activate / Deactivate users
- Assign student to class
- Assign teacher to subjects/classes

### 3.3 Class / Course & Subject Management (Admin)
- Create / Edit / Delete Classes
- Create / Edit / Delete Subjects
- Map Subjects to Classes
- Assign Teachers to Subjects

### 3.4 Assignment Management (Teacher)
- Create Assignment
  - Title
  - Description (rich text preferred)
  - Class + Subject
  - Deadline (date + time)
  - Maximum Marks
  - Status: Draft / Published
- Edit / Delete own assignments
- List of own assignments with filters (Draft / Published / Overdue)

### 3.5 Submission Management
**Student side:**
- List of assignments for their class
- Submit answer (text + optional file upload)
- Edit submission only before deadline
- View status: Not Submitted / Submitted / Graded / Late

**Teacher side:**
- View all submissions for an assignment
- Give marks (0 – Max Marks)
- Write feedback
- Change status
- Filter by status / student name

### 3.6 Dashboard
- **Admin:** Total users, classes, assignments, submissions, recent activity
- **Teacher:** My assignments, pending grading, upcoming deadlines
- **Student:** My pending assignments, recent feedback, upcoming deadlines

---

## 4. User Flows

### 4.1 Teacher – Create & Publish Assignment
1. Login as Teacher
2. Go to Assignments → Create New
3. Fill form (Title, Description, Class, Subject, Deadline, Max Marks)
4. Save as Draft or Publish
5. Assignment appears in students’ list (only if Published)

### 4.2 Student – Submit Assignment
1. Login as Student
2. See list of published assignments for their class
3. Click assignment → View details + deadline
4. Write answer / upload file → Submit
5. Status becomes “Submitted”
6. Can edit until deadline

### 4.3 Teacher – Grade Submission
1. Open assignment → Submissions tab
2. Click a student submission
3. Enter marks + feedback
4. Save → Status becomes “Graded”
5. Student can now see marks & feedback

### 4.4 Admin – Setup
1. Create Classes
2. Create Subjects
3. Create Teachers & Students
4. Assign Teachers to Subjects/Classes
5. Assign Students to Classes

---

## 5. UI / UX Flow (High Level)

### Common
- Responsive (Mobile + Desktop)
- Sidebar navigation based on role
- Dark / Light mode (optional but recommended)
- Toast notifications (success / error)
- Loading states & skeleton loaders
- Form validation with clear error messages

### Pages Structure

**Auth**
- `/login`

**Admin**
- `/admin/dashboard`
- `/admin/users`
- `/admin/classes`
- `/admin/subjects`
- `/admin/settings`

**Teacher**
- `/teacher/dashboard`
- `/teacher/assignments`
- `/teacher/assignments/create`
- `/teacher/assignments/[id]`
- `/teacher/assignments/[id]/submissions`
- `/teacher/assignments/[id]/submissions/[submissionId]`

**Student**
- `/student/dashboard`
- `/student/assignments`
- `/student/assignments/[id]`
- `/student/assignments/[id]/submit`
- `/student/submissions`

---

## 6. Validation Rules

### Assignment
- Title: required, min 3 characters
- Description: required
- Class & Subject: required
- Deadline: must be in the future
- Max Marks: required, number > 0

### Submission
- Answer: required (text or file)
- Cannot submit after deadline (unless teacher allows late)
- Marks: 0 ≤ marks ≤ Max Marks
- Only the owner student can edit their submission before deadline

### User
- Email: unique + valid format
- Password: min 6 characters
- Role: required

---

## 7. Business Rules (Must be tested)

1. Only Published assignments are visible to students
2. Students can only see assignments of their own class
3. Students cannot edit submission after deadline
4. Teachers can only grade submissions of their own assignments
5. Marks cannot exceed Max Marks
6. Admin has full access, Teacher & Student are restricted by role
7. Draft assignments are only visible to the teacher who created them

---

## 8. Non-Functional Requirements

- Responsive UI
- Proper error handling & logging
- Environment variables via `.env.example`
- Clear README with setup instructions
- Unit tests for authorization & core business rules
- No real secrets committed

---

## 9. Demo Credentials (to be filled)

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@example.com      | Admin@123    |
| Teacher  | teacher@example.com    | Teacher@123  |
| Student  | student@example.com    | Student@123  |

---

## 10. Assumptions

- One student belongs to only one class
- One assignment belongs to one class + one subject
- File upload size limit: 10MB (assumption)
- Late submissions are allowed only if teacher explicitly enables it
- No real-time notifications (can be added later)

---

## 11. Out of Scope (for this version)

- Real-time chat / notifications
- Multiple file uploads per submission
- Grade export to Excel/PDF
- Attendance module
- Parent portal

---

**End of PRD**