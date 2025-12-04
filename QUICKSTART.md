# CourseMaster Backend - Quick Start Guide

Get your backend running in 5 minutes.

## ⚡ Quick Start (5 minutes)

### Step 1: Setup Environment
Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/coursemaster
JWT_SECRET=ThisIsYourSuperSecretKeyChangeThisInProduction123456
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000
```

**Don't have MongoDB?** Create one at [mongodb.com/cloud/atlas](https://cloud.mongodb.com/user/register) (free tier available)

### Step 2: Install & Start
```bash
# Install dependencies
npm install

# Seed admin account
npm run seed

# Start development server
npm run dev
```

You should see:
```
Mongo connected
Server running on 5000
```

### Step 3: Test It
Open in browser or Postman:
```
GET http://localhost:5000/health
```

Expected response:
```json
{ "ok": true }
```

### Step 4: Create Your First Course
Use Postman to POST to this endpoint:

```
POST http://localhost:5000/api/admin/courses
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "React Fundamentals",
  "description": "Learn React from scratch",
  "price": 99,
  "category": "programming",
  "tags": ["react", "javascript"],
  "lessons": [
    {
      "title": "Introduction to React",
      "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "content": "<h2>What is React?</h2><p>A JavaScript library for building UIs</p>",
      "order": 1
    },
    {
      "title": "React Hooks",
      "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "content": "<h2>Understanding Hooks</h2>",
      "order": 2
    }
  ],
  "batches": []
}
```

### Step 5: Test Course Listing
```
GET http://localhost:5000/api/courses
```

You should see your course in the response!

---

## 🔑 Admin Credentials

After running `npm run seed`:

```
Email: admin@coursemaster.local
Password: ChangeMe123!
```

To get admin token:

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@coursemaster.local",
  "password": "ChangeMe123!"
}
```

Copy the `token` from response - you'll need it for admin operations.

---

## 📚 API Endpoints Cheat Sheet

### Public (No Auth Required)
```
GET    /api/courses                    - List all courses
GET    /api/courses/:id                - Get course details
```

### Authentication
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Login
GET    /api/auth/me                    - Get current user (needs token)
```

### Student (Needs Token)
```
POST   /api/students/enrollments/:courseId              - Enroll
GET    /api/students/enrollments                        - My courses
PUT    /api/students/enrollments/:enrollmentId/lessons/:lessonId - Mark complete
POST   /api/assignments/:assignmentId/submit            - Submit assignment
POST   /api/quizzes/:quizId/submit                      - Submit quiz
```

### Admin (Needs Admin Token)
```
POST   /api/admin/courses                               - Create course
PUT    /api/admin/courses/:courseId                     - Update course
DELETE /api/admin/courses/:courseId                     - Delete course
GET    /api/admin/enrollments/courses/:courseId         - View enrollments
```

---

## 🧪 Test Workflow

### 1. Register as Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass123","role":"student"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass123"}'
```

Copy the token from response.

### 3. Enroll in a Course
```bash
curl -X POST http://localhost:5000/api/students/enrollments/<course_id> \
  -H "Authorization: Bearer <your_token>"
```

### 4. View Your Enrollments
```bash
curl -X GET http://localhost:5000/api/students/enrollments \
  -H "Authorization: Bearer <your_token>"
```

---

## 🛠️ Troubleshooting

### "Cannot connect to MongoDB"
- Check `MONGODB_URI` in `.env`
- Make sure MongoDB Atlas cluster is running
- Check IP whitelist includes your IP

### "Port 5000 is already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Mac/Linux
lsof -i :5000
kill -9 <pid>
```

### "JWT_SECRET not found"
- Make sure `.env` file exists
- Check it has `JWT_SECRET=...`
- Restart server after creating `.env`

### "Invalid token" errors
- Make sure token is recent (not expired)
- Make sure header is: `Authorization: Bearer <token>` (with space)
- Make sure you're using admin token for admin endpoints

---

## 📁 Key Files

- `src/server.js` - Main entry point
- `src/models/` - Database schemas
- `src/controllers/` - Business logic
- `src/routes/` - API endpoints
- `src/middlewares/` - Auth, validation, error handling
- `.env` - Configuration

---

## 📖 Full Documentation

- **Setup Details**: See `README.md`
- **All API Endpoints**: See `API_DOCUMENTATION.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Frontend Setup**: See `FRONTEND_GUIDE.md`

---

## 🎯 Next Steps

1. ✅ Backend running? Great!
2. Test all endpoints using `TESTING_GUIDE.md`
3. When satisfied, start building frontend
4. See `FRONTEND_GUIDE.md` for detailed instructions
5. Deploy both backend and frontend

---

## 💡 Pro Tips

- Use Postman for testing - it's faster than cURL
- Keep Terminal 1 for server (`npm run dev`)
- Use Terminal 2 for other commands
- Store frequently used tokens in Postman environment
- Test public endpoints first (no auth)
- Test student endpoints second
- Test admin endpoints last

---

## 🆘 Need Help?

1. Check error message in server logs
2. Verify environment variables are set
3. Read relevant documentation file
4. Check `TESTING_GUIDE.md` for examples
5. Verify MongoDB is connected

---

**Backend ready?** Now build the frontend! 🚀

See `FRONTEND_GUIDE.md` for complete instructions.
