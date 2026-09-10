# 🚀 Vercel Deployment Guide — Quiz System

Follow these steps to deploy **Backend** and **Frontend** on Vercel so the student portal always loads quizzes smoothly.

---

## 📌 Step 1: Deploy Backend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your GitHub repository: `arav144/edulinequiz`.
3. In **Project Configuration**:
   - **Project Name**: `edulinequiz-backend`
   - **Root Directory**: Click `Edit` and select **`backend`** (Important!).
   - **Framework Preset**: `Other`
4. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | `mongodb+srv://aravjha786_db_user:3B9t4PIWuExhpm78@2026.5qcykmp.mongodb.net/?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `quiz_system_super_secure_jwt_secret_2026_x99y` |
   | `NODE_ENV` | `production` |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | `admin123` |
   | `CLOUDINARY_CLOUD_NAME` | `ulk2jofl` |
   | `CLOUDINARY_API_KEY` | `284442367654776` |
   | `CLOUDINARY_API_SECRET` | `lFeMLiQ4Vp5Xo-utWM3EwFvuPmg` |

5. Click **"Deploy"**.
6. Copy your Backend URL (e.g. `https://edulinequiz-backend.vercel.app`).
   - Test Health: `https://edulinequiz-backend.vercel.app/api/health`
   - Test Quizzes: `https://edulinequiz-backend.vercel.app/api/quizzes/available`

---

## 📌 Step 2: Deploy Frontend on Vercel

1. Go back to [Vercel Dashboard](https://vercel.com/dashboard) → **"Add New..."** → **"Project"**.
2. Select the same repository: `arav144/edulinequiz`.
3. In **Project Configuration**:
   - **Project Name**: `edulinequiz-frontend`
   - **Root Directory**: Click `Edit` and select **`frontend`** (Important!).
   - **Framework Preset**: `Next.js` (automatically selected).
4. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | *Your Backend URL from Step 1* (e.g. `https://edulinequiz-backend.vercel.app`) |

5. Click **"Deploy"**.
6. That's it! Open your frontend URL (`https://edulinequiz-frontend.vercel.app`) — students will see and start the **हिंदी दिवस प्रतियोगिता** without any error!

