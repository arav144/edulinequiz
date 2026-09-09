# 🚀 Vercel Deployment Guide — Quiz System

Follow these simple steps to deploy both the **Frontend** and **Backend** on Vercel.

---

## 📌 Step 1: Deploy Backend on Vercel (or Render)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your GitHub repository.
3. In **Project Configuration**:
   - **Project Name**: `quiz-system-backend`
   - **Root Directory**: Click `Edit` and select **`backend`**.
   - **Framework Preset**: `Other`
4. In **Environment Variables**, add the following:
   | Key | Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://aravjha786_db_user:3B9t4PIWuExhpm78@2026.5qcykmp.mongodb.net/?retryWrites=true&w=majority` | Your MongoDB Atlas connection |
   | `JWT_SECRET` | `quiz_system_super_secure_jwt_secret_2026_x99y` | JWT secret |
   | `NODE_ENV` | `production` | Production mode |
   | `ADMIN_USERNAME` | `admin` | Admin panel login username |
   | `ADMIN_PASSWORD` | `admin123` | Admin panel login password |
   | `CLOUDINARY_CLOUD_NAME` | `ulk2jofl` | Cloudinary name |
   | `CLOUDINARY_API_KEY` | `284442367654776` | Cloudinary key |
   | `CLOUDINARY_API_SECRET` | `lFeMLiQ4Vp5Xo-utWM3EwFvuPmg` | Cloudinary secret |

5. Click **"Deploy"**.
6. Once deployed, note down your Backend URL (e.g., `https://quiz-system-backend.vercel.app`).
   - Health Check: `https://quiz-system-backend.vercel.app/api/health`
   - Admin Panel: `https://quiz-system-backend.vercel.app/admin`

---

## 📌 Step 2: Deploy Frontend on Vercel

1. Return to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select the same GitHub repository.
3. In **Project Configuration**:
   - **Project Name**: `quiz-system-frontend`
   - **Root Directory**: Click `Edit` and select **`frontend`**.
   - **Framework Preset**: `Next.js` (automatically detected).
4. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://quiz-system-backend.vercel.app` *(use the backend URL from Step 1)* |

5. Click **"Deploy"**.
6. Once deployed, your students can access the quiz at:
   `https://quiz-system-frontend.vercel.app`

---

## 📌 Step 3: Link Frontend URL in Backend (Final Touch)

1. In Vercel, open your `quiz-system-backend` project settings → **Environment Variables**.
2. Add / Update:
   - `FRONTEND_URL` = `https://quiz-system-frontend.vercel.app`
3. Click **Redeploy** on the backend so CORS is fully locked to your frontend domain.

---

## ✅ Local Development Commands

- **Frontend**: `cd frontend && npm run dev` (Runs on port 3000)
- **Backend**: `cd backend && npm run dev` (Runs on port 5000)
