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
   | Key | Value | Notes |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority` | MongoDB Atlas Connection String |
   | `JWT_SECRET` | `<your_secure_random_jwt_secret>` | Session secret |
   | `NODE_ENV` | `production` | Production mode |
   | `ADMIN_USERNAME` | `<your_admin_username>` | Admin username |
   | `ADMIN_PASSWORD` | `<your_admin_password>` | Admin password |
   | `UV_THREADPOOL_SIZE` | `16` | **Important**: Configure as an environment variable in Vercel before Node starts so libuv allocates worker threads for bcrypt concurrency. |
   | `CLOUDINARY_CLOUD_NAME` | `<your_cloudinary_cloud_name>` | Cloudinary name |
   | `CLOUDINARY_API_KEY` | `<your_cloudinary_api_key>` | Cloudinary key |
   | `CLOUDINARY_API_SECRET` | `<your_cloudinary_api_secret>` | Cloudinary secret |

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

