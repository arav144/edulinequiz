================================================================================
QUIZ SYSTEM — BACKEND API & ADMIN ENGINE
================================================================================

This folder contains the complete, production-ready backend for the Quiz System.
It provides:
  1. Express.js REST API for Student Examinations.
  2. Dedicated Administrator Console served on /admin with unified single-page Quiz + Questions builder.
  3. MongoDB Atlas data persistence with strict database-level constraints.
  4. Status-based quiz availability (Draft / Published / Closed).
  5. 1-Attempt-Per-Student enforcement via MongoDB compound unique index.

--------------------------------------------------------------------------------
1. INSTALLATION & SETUP
--------------------------------------------------------------------------------

Step 1: Open a terminal inside the backend directory:
   cd Quiz-System/backend

Step 2: Install required NPM dependencies:
   npm install

Step 3: Create your environment file (.env):
   Copy .env.example to .env
   Windows command: copy .env.example .env
   Mac/Linux command: cp .env.example .env

--------------------------------------------------------------------------------
2. ENVIRONMENT VARIABLES CONFIGURATION (.env)
--------------------------------------------------------------------------------

Configure the following parameters in backend/.env:

PORT=5000
  - The local port on which the Express server listens (Default: 5000).

NODE_ENV=development
  - Environment mode ('development' or 'production').

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
  - Your MongoDB Atlas connection URI string.
  - IMPORTANT: The frontend NEVER receives or accesses this connection string!

JWT_SECRET=your_super_secret_jwt_key_here
  - A secure cryptographic secret used to sign Admin session tokens.

FRONTEND_URL=http://localhost:3000
  - The permitted origin allowed to perform cross-origin API calls.
  - When deployed on Vercel, change this to your deployed frontend domain (e.g. https://your-quiz-frontend.vercel.app).

ADMIN_USERNAME=admin
  - Username for Admin Console authentication.

ADMIN_PASSWORD=admin123
  - Password for Admin Console authentication.

--------------------------------------------------------------------------------
3. RUNNING LOCALLY
--------------------------------------------------------------------------------

To start the backend server:
   npm start

Console will print:
   🚀 Quiz System Backend Server running on port 5000
   🌍 API Health Check : http://localhost:5000/api/health
   🔐 Admin Application: http://localhost:5000/admin

Admin Console Access:
   Open browser at: http://localhost:5000/admin
   Log in with: admin / admin123

--------------------------------------------------------------------------------
4. MONGODB ATLAS DATABASE SETUP
--------------------------------------------------------------------------------

1. Create a free M0 Cluster on https://cloud.mongodb.com.
2. In Database Access:
   - Create a user (e.g., dbAdmin) with "Read and write to any database" privileges.
   - Note the password carefully.
3. In Network Access:
   - Click "Add IP Address" -> "Allow Access from Anywhere" (0.0.0.0/0).
   - This ensures Vercel serverless functions can connect without timeout.
4. Under Clusters -> Connect -> Drivers:
   - Copy the connection string format:
     mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   - Paste it into backend/.env under MONGODB_URI.

--------------------------------------------------------------------------------
5. REST API ENDPOINTS SPECIFICATION
--------------------------------------------------------------------------------

A. HEALTH DIAGNOSTICS:
   GET /api/health
   - Returns { status: "healthy", timestamp: ... }

B. ADMIN AUTHENTICATION:
   POST /api/auth/login
   - Body: { "username": "admin", "password": "..." }
   - Returns: { "success": true, "token": "JWT_TOKEN", "admin": {...} }

   GET /api/auth/me
   - Headers: { "Authorization": "Bearer <JWT_TOKEN>" }

C. STUDENT ASSESSMENT ENDPOINTS:
   GET /api/quizzes/available?studentIdentifier=ROLL101
   - Returns all currently published quizzes (Draft and Closed quizzes are excluded).
   - Automatically marks whether the student has already attempted each quiz.

   POST /api/quizzes/:id/verify-student
   - Body: { "studentIdentifier": "ROLL101", "name": "Alice" }
   - Checks if this student has already submitted an attempt.

   GET /api/quizzes/:id/start?studentIdentifier=ROLL101
   - Verifies quiz is Published and that student has NOT already attempted.
   - Returns sanitized questions (NEVER exposes correctAnswer or explanation).

   POST /api/quizzes/:id/attempt
   - Body: {
       "studentIdentifier": "ROLL101",
       "name": "Alice",
       "answers": { "questionId_1": "A", "questionId_2": "C" }
     }
   - Grades the attempt, enforces { studentId: 1, quizId: 1 } compound unique index.
   - Returns final score, total marks, percentage, and solution breakdown.

D. ADMIN QUIZ & QUESTION MANAGEMENT (Protected via JWT Bearer token):
   GET    /api/admin/quizzes
   POST   /api/admin/quizzes
   GET    /api/admin/quizzes/:id
   PUT    /api/admin/quizzes/:id
   DELETE /api/admin/quizzes/:id

   POST   /api/admin/questions
   PUT    /api/admin/questions/:id
   DELETE /api/admin/questions/:id

   GET    /api/admin/quizzes/:id/attempts

--------------------------------------------------------------------------------
6. VERCEL DEPLOYMENT (INDEPENDENT)
--------------------------------------------------------------------------------

1. Push your backend to GitHub:
   cd Quiz-System/backend
   git init && git add . && git commit -m "Initial backend"

2. Go to https://vercel.com/new:
   - Import your repository.
   - Set Root Directory to: backend
   - Framework Preset: Other

3. Configure Environment Variables in Vercel Project Settings:
   - MONGODB_URI  = <your_mongodb_atlas_uri>
   - JWT_SECRET   = <secure_random_key>
   - FRONTEND_URL = https://your-frontend-domain.vercel.app
   - ADMIN_USERNAME = admin
   - ADMIN_PASSWORD = your_strong_admin_password
   - NODE_ENV     = production

4. Click Deploy.
   Vercel will deploy your API server at https://your-backend.vercel.app.
   Test health at: https://your-backend.vercel.app/api/health
   Access Admin at: https://your-backend.vercel.app/admin

--------------------------------------------------------------------------------
7. COMMON ERRORS & SOLUTIONS
--------------------------------------------------------------------------------

Issue: MongooseServerSelectionError / Connect timeout.
Solution: Ensure your MongoDB Atlas Network Access has IP 0.0.0.0/0 enabled.

Issue: "Cannot publish quiz! Configured question quota is X..."
Solution: You must add all configured questions before publishing. If you set
          numberOfQuestions = 10, exactly 10 MCQ questions must be added.

Issue: "This quiz has already been attempted by this student."
Solution: Working as designed. MongoDB compound unique index { studentId: 1, quizId: 1 }
          strictly limits each student to one attempt per quiz.
================================================================================
