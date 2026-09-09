================================================================================
QUIZ SYSTEM — STUDENT FRONTEND PORTAL
================================================================================

This folder contains the 100% student-facing web application for the Quiz System.
It is completely decoupled from the backend and contains NO administrative buttons,
admin links, or teacher functions.

Students can:
  1. Identify via their Student Roll Number or ID.
  2. View available published examinations immediately.
  3. Attempt examinations once (strictly 1 attempt per student).
  4. Answer 4-option Multiple Choice Questions (A, B, C, D).
  5. Receive automated grading, detailed question review, and download PDF results/certificates.

--------------------------------------------------------------------------------
1. INSTALLATION & LOCAL DEVELOPMENT
--------------------------------------------------------------------------------

Step 1: Open terminal in this folder:
   cd Quiz-System/frontend

Step 2: Install dependencies:
   npm install

Step 3: Create your local environment file (.env.local):
   Windows command: copy .env.example .env.local
   Mac/Linux command: cp .env.example .env.local

Step 4: Configure NEXT_PUBLIC_API_URL in .env.local:
   For local development:
   NEXT_PUBLIC_API_URL=http://localhost:5000

Step 5: Run the Next.js development server:
   npm run dev

Open browser at: http://localhost:3000

--------------------------------------------------------------------------------
2. PRODUCTION BUILD COMMAND
--------------------------------------------------------------------------------

To create an optimized production build:
   npm run build

To launch the compiled production build locally:
   npm start

--------------------------------------------------------------------------------
3. VERCEL DEPLOYMENT (INDEPENDENT)
--------------------------------------------------------------------------------

1. Push your frontend to GitHub:
   cd Quiz-System/frontend
   git init && git add . && git commit -m "Initial student frontend"

2. Go to https://vercel.com/new:
   - Import your repository.
   - Set Root Directory to: frontend
   - Framework Preset: Next.js

3. Configure Environment Variables in Vercel:
   NEXT_PUBLIC_API_URL = https://your-backend-api.vercel.app

   (Point this to your deployed backend Vercel domain, without trailing slash).

4. Click Deploy.
   Vercel will build and host your student portal at https://your-frontend.vercel.app.

--------------------------------------------------------------------------------
4. CONNECTING FRONTEND TO BACKEND
--------------------------------------------------------------------------------

Architecture:
   Student Browser
         ↓
   Frontend Vercel URL (https://your-frontend.vercel.app)
         ↓
   Backend REST API URL (https://your-backend.vercel.app)
         ↓
   MongoDB Atlas

The frontend reads NEXT_PUBLIC_API_URL and calls:
   - GET  /api/quizzes/available
   - POST /api/quizzes/:id/verify-student
   - GET  /api/quizzes/:id/start
   - POST /api/quizzes/:id/attempt
   - GET  /api/results/:id/pdf
   - GET  /api/results/:id/certificate

--------------------------------------------------------------------------------
5. COMMON ERRORS & TROUBLESHOOTING
--------------------------------------------------------------------------------

Issue: "Unable to reach examination server at http://localhost:5000"
Solution: Ensure your backend server is running on port 5000:
          cd Quiz-System/backend && npm start

Issue: "This quiz has already been attempted by this student."
Solution: Each student (by Roll Number/ID) can submit each quiz only once.
          To test with another student, click "Change" candidate in the top-right
          and enter a different Roll Number.

Issue: Quiz not appearing in student list
Solution: The quiz must have status set to 'Published'. Draft and Closed quizzes
          are not accessible to students.
================================================================================
