# 🚀 NEXUS AI Deployment Guide

NEXUS AI is now built with a modern Next.js frontend and a FastAPI backend. This guide covers deploying the backend to Render/Railway and the frontend to Vercel.

## 📦 Backend Deployment (Render / Railway)
The backend (FastAPI) handles LLM routing, Firebase logic, and audio processing.

1. **GitHub Repository**: Push your code to a private GitHub repo.
2. **Platform Setup (Render example)**:
   - Create a new **Web Service**.
   - Select your repository.
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
3. **Environment Variables**: Add all your keys (GROQ, GEMINI, etc.) to the Render dashboard.
4. **Deploy**: Get your public URL (e.g., `https://nexus-backend.onrender.com`).

---

## ⚡ Frontend Deployment (Vercel)
The Next.js frontend is optimized for zero-config Vercel deployment.

1. **Link to Vercel**: Import your GitHub repo into Vercel.
2. **Root Directory**: Set the **Root Directory** to `frontend`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_BACKEND_URL`: Set this to your deployed Backend URL (e.g., `https://nexus-backend.onrender.com`).
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key.
   - *(Add other Firebase variables from `.env.example` as needed)*
4. **Deploy**: Vercel will automatically build (`npm run build`) and deploy the app.

---

## 🐳 Local Docker Testing
To run the backend locally via Docker:
```bash
docker-compose up -d --build
```
*Note: The frontend should be run locally using `cd frontend && npm run dev`.*

---

## 🔒 Firebase Security
- Ensure your `firebase-key.json` is properly loaded via environment variables or secret mounts in your backend.
- Set up **Firebase Authentication** (Google / Anonymous) in the Firebase Console so the frontend login works properly.

**NEXUS AI V5 Elite** | Designed for Stability and Scale.
