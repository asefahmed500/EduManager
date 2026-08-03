Here’s a clear **module-by-module development checklist**  
ordered from **first → last**.  
Do them one by one in this exact sequence.

---

### 1. Project Setup & Foundation (Do this first)
- [ ] Create Next.js project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install and initialize shadcn/ui (`npx shadcn@latest init`)
- [ ] Install all needed shadcn components
- [ ] Set up folder structure (app, components, lib, types, etc.)
- [ ] Create `.env.example` and `.env.local`
- [ ] Set up PostgreSQL database connection
- [ ] Create basic database schema (Users, Classes, Subjects, Assignments, Submissions)
- [ ] Create Prisma (or Drizzle) schema + migration
- [ ] Seed demo data (Admin, Teacher, Student accounts + sample class/subject)

---

### 2. Authentication Module
- [ ] Create Login page
- [ ] Implement JWT authentication (login API)
- [ ] Create middleware for protected routes
- [ ] Implement role-based route protection
- [ ] Create logout functionality
- [ ] Store user session (JWT in cookie or localStorage)
- [ ] Create Auth context / provider
- [ ] Test login with Admin, Teacher, Student accounts

---

### 3. Admin Module – User Management
- [ ] Admin Dashboard (basic layout)
- [ ] List all users page
- [ ] Create new user form (with role selection)
- [ ] Edit user functionality
- [ ] Activate / Deactivate user
- [ ] Delete user
- [ ] Assign student to a class
- [ ] Protect all admin APIs with Admin role check

---

### 4. Admin Module – Class & Subject Management
- [ ] Create Class page (CRUD)
- [ ] Create Subject page (CRUD)
- [ ] Map Subject to Class
- [ ] Assign Teacher to Subject + Class
- [ ] List Classes and Subjects with filters
- [ ] Test all admin-only access

---

### 5. Shared Layout & Navigation
- [ ] Create role-based Sidebar / Navbar
- [ ] Create different menus for Admin / Teacher / Student
- [ ] Create common Dashboard layout
- [ ] Add loading states and skeleton loaders
- [ ] Add toast notification system

---

### 6. Teacher Module – Assignment Management
- [ ] Teacher Dashboard
- [ ] List of Teacher’s own assignments
- [ ] Create Assignment form (Title, Description, Class, Subject, Deadline, Max Marks)
- [ ] Save as Draft functionality
- [ ] Publish / Unpublish assignment
- [ ] Edit Assignment
- [ ] Delete Assignment
- [ ] Filter assignments (Draft / Published / Overdue)
- [ ] Protect all teacher assignment APIs

---

### 7. Student Module – View Assignments
- [ ] Student Dashboard
- [ ] List of published assignments for student’s class
- [ ] Assignment detail page (title, description, deadline, max marks)
- [ ] Show remaining time / overdue status
- [ ] Protect student routes

---

### 8. Submission Module (Core Feature)
- [ ] Student: Submit answer (text + optional file)
- [ ] Student: Edit submission only before deadline
- [ ] Student: View own submission status
- [ ] Teacher: View all submissions of an assignment
- [ ] Teacher: Open individual submission
- [ ] Teacher: Give marks (with validation ≤ max marks)
- [ ] Teacher: Write feedback
- [ ] Teacher: Change submission status
- [ ] Show marks & feedback to student after grading
- [ ] Handle late submission logic

---

### 9. Dashboard Improvements
- [ ] Admin Dashboard → total users, classes, assignments, submissions
- [ ] Teacher Dashboard → my assignments, pending grading, upcoming deadlines
- [ ] Student Dashboard → pending assignments, recent feedback, upcoming deadlines

---

### 10. Validation, Error Handling & Security
- [ ] Add Zod validation on all forms and APIs
- [ ] Proper error messages on frontend
- [ ] Backend error handling and logging
- [ ] Make sure role-based authorization is enforced on every API
- [ ] Prevent students from seeing other students’ data
- [ ] Prevent teachers from accessing other teachers’ assignments

---

### 11. Testing
- [ ] Write unit tests for important business rules
- [ ] Test authorization (Admin / Teacher / Student access)
- [ ] Test submission workflow (before deadline / after deadline)
- [ ] Test marks validation
- [ ] Test draft vs published visibility

---

### 12. Final Polish & Documentation (Do this last)
- [ ] Make UI fully responsive
- [ ] Add loading and empty states everywhere
- [ ] Write complete README.md
- [ ] Add setup instructions
- [ ] Add database setup instructions
- [ ] Add demo credentials
- [ ] Create `.env.example`
- [ ] Final testing of all three roles
- [ ] Clean up unused code
- [ ] Prepare GitHub repository for submission

---

**Recommended Order Summary (Quick View)**

1. Project Setup  
2. Authentication  
3. Admin – Users  
4. Admin – Classes & Subjects  
5. Layout & Navigation  
6. Teacher – Assignments  
7. Student – View Assignments  
8. Submission & Grading (most important)  
9. Dashboards  
10. Validation & Security  
11. Testing  
12. README + Final Polish  

Follow this checklist strictly one module at a time.  
Do not jump ahea