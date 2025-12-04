# CourseMaster Backend - EdTech Platform API

A comprehensive REST API for a full-featured e-learning platform built with **Node.js**, **Express.js**, and **MongoDB**.

## 📋 Features

### ✅ Authentication & Authorization

- JWT-based authentication with bcrypt password hashing
- Student, Instructor, and Admin role support
- Protected routes with role-based access control
- Automatic token verification on protected endpoints

### ✅ Public Features

- **Course Listing** with pagination, search, sorting, and filtering
  - Search by title/description (full-text search)
  - Sort by price (low-to-high, high-to-low)
  - Filter by category and price range
  - Pagination with configurable page size
- **Course Details** with instructor info, syllabus, and batches

### ✅ Student Features

- **Enrollment Management**
  - Enroll in courses
  - View all enrolled courses with progress tracking
  - Track completion percentage for each course
- **Course Consumption**
  - Watch video lectures (embedded URLs)
  - Mark lessons as completed
  - Progress bar updates in real-time
- **Assignments**
  - View course assignments
  - Submit assignments (text or Google Drive link)
  - Resubmit assignments
  - View grades and feedback from instructors
- **Quizzes**
  - Take multiple-choice quizzes
  - Multiple attempts allowed
  - Instant score display with passing/failing indicator
  - View best attempt score

### ✅ Admin/Instructor Features

- **Course Management** (CRUD operations)
  - Create, read, update, delete courses
  - Define lessons with video URLs and content
  - Create batches for courses
  - Manage course pricing and categorization
- **Enrollment Management**
  - View all enrollments for a course
  - Filter enrollments by batch
  - View student progress statistics
  - Track enrollment trends
- **Assignment Management**
  - Create assignments for courses
  - View all student submissions
  - Grade submissions with feedback
  - Re-grading capability
- **Quiz Management**
  - Create quizzes with multiple-choice questions
  - Set passing scores
  - View all student attempts
  - Review quiz performance

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose v9.0.0
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt for password hashing
- **Validation**: Joi for input validation
- **CORS**: Enabled for cross-origin requests
- **Development**: nodemon for hot-reload

---

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd coursemaster-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```
