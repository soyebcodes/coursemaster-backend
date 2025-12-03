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

3. **Create `.env` file** in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coursemaster

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d

   # Server
   NODE_ENV=development
   PORT=5000
   ```

4. **Seed admin account** (optional but recommended)

   ```bash
   npm run seed
   ```

   This creates an admin user:

   - Email: `admin@coursemaster.local`
   - Password: `ChangeMe123!`

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`

---

## 🚀 Running the Application

### Development Mode (with hot-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Run Admin Seeder

```bash
npm run seed
```

---

## 📁 Project Structure

```
src/
├── controllers/           # Business logic handlers
│   ├── auth.controller.js
│   ├── courses.controller.js
│   ├── enrollment.controller.js
│   ├── admin.controller.js
│   ├── assignment.controller.js
│   ├── quiz.controller.js
│   └── adminEnrollment.controller.js
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── Course.js
│   ├── Enrollment.js
│   ├── Assignment.js
│   └── Quiz.js
├── routes/              # API endpoints
│   ├── auth.route.js
│   ├── courses.route.js
│   ├── enrollment.route.js
│   ├── admin.route.js
│   ├── assignment.route.js
│   ├── quiz.route.js
│   └── adminEnrollment.route.js
├── middlewares/         # Express middleware
│   ├── auth.middleware.js
│   ├── roleCheck.middleware.js
│   ├── validate.middleware.js
│   └── error.middleware.js
├── utils/              # Utility functions
│   └── progressHelper.js
└── server.js           # Server entry point

seedAdmin.js            # Admin seeding script
API_DOCUMENTATION.md    # Complete API reference
README.md              # This file
```

---

## 🔐 Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access Control**: Different permission levels for students, instructors, and admins
4. **Input Validation**: All inputs validated using Joi schema validation
5. **CORS Protection**: Cross-Origin Resource Sharing configured
6. **Unique Indexes**: Database constraints prevent duplicate enrollments and submissions

---

## 📚 API Endpoints Overview

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Public Courses

- `GET /api/courses` - List courses (with pagination, search, filter, sort)
- `GET /api/courses/:id` - Get course details

### Student Enrollments

- `POST /api/students/enrollments/:courseId` - Enroll in course
- `GET /api/students/enrollments` - Get all enrollments
- `GET /api/students/enrollments/:enrollmentId` - Get enrollment details
- `PUT /api/students/enrollments/:enrollmentId/lessons/:lessonId` - Mark lesson complete

### Assignments

- `POST /api/assignments/:assignmentId/submit` - Submit assignment
- `GET /api/assignments/:assignmentId/submissions` - View submissions (admin)
- `POST /api/assignments/submissions/:submissionId/grade` - Grade submission (admin)

### Quizzes

- `GET /api/quizzes/:quizId` - Get quiz questions
- `POST /api/quizzes/:quizId/submit` - Submit quiz attempt
- `GET /api/quizzes/:quizId/myattempt` - Get student's best attempt
- `GET /api/quizzes/:quizId/attempts` - View attempts (admin)

### Admin Course Management

- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:courseId` - Update course
- `DELETE /api/admin/courses/:courseId` - Delete course
- `GET /api/admin/courses/:courseId/edit` - Get course for editing

### Admin Enrollment Management

- `GET /api/admin/enrollments/courses/:courseId` - View course enrollments
- `GET /api/admin/enrollments/courses/:courseId/batches/:batchId` - View batch enrollments
- `GET /api/admin/enrollments/courses/:courseId/stats` - Get course statistics

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation with request/response examples.

---

## 🗄️ Database Schema

### User

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (student|instructor|admin),
  createdAt: Date
}
```

### Course

```javascript
{
  _id: ObjectId,
  title: String (indexed for text search),
  description: String (indexed for text search),
  instructor: ObjectId (ref: User),
  price: Number (indexed),
  category: String (indexed),
  tags: [String],
  lessons: [{
    _id: ObjectId,
    title: String,
    videoUrl: String,
    content: String,
    order: Number
  }],
  batches: [{
    _id: ObjectId,
    name: String,
    startDate: Date,
    endDate: Date
  }],
  createdAt: Date
}
```

### Enrollment

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User, indexed),
  course: ObjectId (ref: Course, indexed),
  batch: ObjectId (ref: Batch, optional),
  enrolledAt: Date,
  progress: [{
    lessonId: ObjectId,
    completed: Boolean,
    completedAt: Date
  }],
  percentageCompleted: Number,
  status: String (active|completed|dropped)
  // Unique index: (student, course)
}
```

### Assignment & Submission

```javascript
// Assignment
{
  _id: ObjectId,
  course: ObjectId (ref: Course, indexed),
  title: String,
  description: String,
  dueDate: Date,
  createdAt: Date
}

// Submission
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  assignment: ObjectId (ref: Assignment, indexed),
  submissionText: String,
  submissionLink: String,
  submittedAt: Date,
  grade: Number (0-100),
  feedback: String,
  gradedAt: Date,
  gradedBy: ObjectId (ref: User)
  // Unique index: (student, assignment)
}
```

### Quiz & Attempt

```javascript
// Quiz
{
  _id: ObjectId,
  course: ObjectId (ref: Course, indexed),
  title: String,
  description: String,
  questions: [{
    question: String,
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    explanation: String
  }],
  passingScore: Number,
  createdAt: Date
}

// QuizAttempt
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  quiz: ObjectId (ref: Quiz, indexed),
  answers: [{
    questionIndex: Number,
    selectedOption: String
  }],
  score: Number (0-100),
  passed: Boolean,
  attemptedAt: Date
  // Index: (student, quiz)
}
```

---

## 🔍 Key Implementation Details

### Progress Tracking

- Progress is stored as an array of lesson completion records
- `percentageCompleted` is calculated on-the-fly based on completed lessons
- When all lessons are completed, enrollment status automatically changes to "completed"

### Text Search

- Course titles and descriptions are indexed for full-text search
- Search query is flexible and finds partial matches

### Quiz Scoring

- Score calculated as: `(correctAnswers / totalQuestions) * 100`
- Students see only question text and options (not correct answers)
- Admin/Instructors see full quiz details with explanations
- Students can take quizzes multiple times; best score is tracked

### Assignment Grading

- Assignments can be submitted multiple times (resubmission)
- Each submission is timestamped
- Grades and feedback can be added by instructors
- Grade is cleared on resubmission

### Authorization

- Students can only view their own enrollments
- Instructors can manage courses they created
- Admins can manage any course/enrollment/assignment/quiz
- Role checking is enforced on all protected endpoints

---

## 🧪 Testing the API

You can test the API using:

- **Postman** - Import endpoints and test with GUI
- **cURL** - Command-line HTTP client
- **Thunder Client** - VS Code extension

Example cURL requests:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Get current user (replace TOKEN)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# List courses
curl -X GET "http://localhost:5000/api/courses?page=1&limit=12&sort=price_asc"
```

---

## 🚢 Deployment

### Deploy to Render.com

1. Push code to GitHub
2. Connect GitHub repo to Render
3. Set environment variables in Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV=production`
4. Deploy from main branch

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in project root
3. Set environment variables in Vercel dashboard
4. Configure build command: `npm install`
5. Configure start command: `npm start`

### Environment Variables Required

```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<random-secure-string>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist includes your IP
- Ensure credentials are correct

### JWT Token Expiration

- Default expiration: 7 days
- Change `JWT_EXPIRES_IN` in `.env` if needed
- Frontend should handle token refresh before expiration

### CORS Issues

- CORS is enabled with `origin: true`
- Frontend must send requests to correct API URL
- Credentials are enabled for cookie/auth header support

### Port Already in Use

- Change `PORT` in `.env`
- Or kill process using the port: `netstat -ano | findstr :5000` (Windows)

---

## 📋 Environment Variables Checklist

Before deployment, ensure these are set:

- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Complex secret string (min 32 chars recommended)
- ✅ `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- ✅ `NODE_ENV` - "development" or "production"
- ✅ `PORT` - Server port (default: 5000)

---

## 📝 API Response Format

### Success Response (200, 201)

```json
{
  "message": "Operation successful",
  "data": {
    /* response data */
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "message": "Error description"
}
```

### Paginated Response

```json
{
  "data": [
    /* items */
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "totalPages": 9
  }
}
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Create Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

Built as a comprehensive technical assessment for full-stack web developer roles.

---

## 📞 Support

For issues and questions:

1. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Review error messages in server logs
3. Verify all environment variables are set correctly

---

## 🎯 Next Steps

Once backend is deployed:

1. ✅ Create frontend with Next.js/React
2. ✅ Implement student dashboard
3. ✅ Add course listing with filters
4. ✅ Build admin panel for course management
5. ✅ Deploy frontend to Vercel/Netlify
6. ✅ Add analytics and bonus features

See frontend README for detailed instructions.
