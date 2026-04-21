# weightwAIse Deployment Guide

Deploy the frontend to **Vercel** and the backend to **Render** from the GitHub repo.

```
GitHub (source)
  ├── frontend/  → Vercel  (Next.js, static CDN + serverless)
  └── backend/   → Render  (FastAPI + Postgres + persistent Python runtime)
Pinecone + Gemini API are already cloud-hosted — no deploy step.
```

---

## 0. Prerequisites

- GitHub account with push access to `Alihomaei/weightwAIse`
- [Vercel](https://vercel.com/signup) account (free)
- [Render](https://render.com/register) account (free)
- API keys handy:
  - `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/apikey))
  - `PINECONE_API_KEY` (from [Pinecone console](https://app.pinecone.io/))

---

## 1. Push the latest code to GitHub

```bash
cd /home/nezamilab/Projects/weightwAIse
git add .
git commit -m "deployment: Render + Vercel config, PWA, mobile drawer"
git push origin main
```

---

## 2. Deploy the backend to Render

The repo contains `render.yaml` at the root — Render reads this to provision the web service and Postgres DB automatically.

1. Log in to [render.com](https://render.com) and click **New +** → **Blueprint**.
2. Connect your GitHub account if prompted, then select `Alihomaei/weightwAIse`.
3. Render will detect `render.yaml` and show two resources to create:
   - **weightwaise-backend** (web service)
   - **weightwaise-db** (Postgres)
4. Click **Apply**.

### Set the secret environment variables

Still in the Render dashboard, open the **weightwaise-backend** service → **Environment** tab and fill in:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini key |
| `PINECONE_API_KEY` | your Pinecone key |
| `SEED_USER_PASSWORD` | `Niloufar@2026!` |
| `FRONTEND_URL` | leave blank for now — we'll fill it in step 4 |
| `NCBI_EMAIL` | your email (optional; only needed for PubMed ingestion) |
| `NCBI_API_KEY` | your NCBI key (optional) |

`JWT_SECRET` is generated automatically. `DATABASE_URL` is wired from the Postgres DB automatically.

### First deploy behavior

On startup the backend will:
- Create all tables in Postgres
- Create the Pinecone index `weightwaise` if it doesn't exist (3072-dim, cosine, serverless AWS us-east-1)
- Seed the `niloufar` user (since `SEED_USER_USERNAME` and `SEED_USER_PASSWORD` are set)

Watch the **Logs** tab. When you see `weightwAIse backend started successfully.`, copy the service URL (e.g. `https://weightwaise-backend.onrender.com`) — you'll need it in step 3.

> **Free tier notes:**
> - The web service spins down after 15 min of inactivity. First request after spin-down takes ~30-60s to wake up. Upgrade to the **Starter** plan ($7/mo) to avoid this.
> - The free Postgres database expires after 90 days. Upgrade to **Basic-256MB** ($7/mo) for permanence.

---

## 3. Deploy the frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import `Alihomaei/weightwAIse`.
3. In the **Configure Project** step:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** (leave default — `next build`)
   - **Output Directory:** (leave default)
4. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the Render backend URL from step 2 (e.g. `https://weightwaise-backend.onrender.com`) |
5. Click **Deploy**.

When the build finishes, Vercel gives you a production URL like `https://weightwaise.vercel.app`. Copy it.

---

## 4. Wire the backend CORS to the Vercel URL

Go back to **Render** → weightwaise-backend → **Environment** and set:

| Key | Value |
|---|---|
| `FRONTEND_URL` | `https://weightwaise.vercel.app` (your Vercel production URL) |

Render will redeploy automatically. `CORS_ALLOW_ORIGIN_REGEX` is already set to match Vercel preview URLs (`weightwaise-*.vercel.app`), so preview deploys will also work.

---

## 5. Verify the deploy

Open `https://weightwaise.vercel.app` in your browser:

1. Log in as **niloufar** / **Niloufar@2026!**
2. Start a new consultation — confirm chat streaming works
3. Check the sidebar, language toggle, voice input

If the backend is slow to respond (cold start on free tier), the first message may take 30-60s. Later messages are instant.

---

## 6. Install on iPhone home screen

1. In Safari on iPhone, open `https://weightwaise.vercel.app`
2. Tap the **Share** button → **Add to Home Screen**
3. Confirm — the app icon uses the weightwAIse logo
4. Launch from the home screen — runs in standalone mode (no Safari chrome) thanks to the PWA manifest

---

## 7. Share the link with Niloufar

Send her:

```
URL: https://weightwaise.vercel.app
Username: niloufar
Password: Niloufar@2026!

On iPhone: open the URL in Safari, tap Share, then "Add to Home Screen"
to install it like a native app.
```

---

## Ongoing: deploy updates

Both Vercel and Render are wired to auto-deploy on push to `main`:

```bash
git push origin main
# → Vercel rebuilds the frontend (~2 min)
# → Render rebuilds the backend (~5 min)
```

You can watch progress on each dashboard.

---

## Troubleshooting

**CORS errors in browser console after Vercel deploy**
Check that `FRONTEND_URL` on Render matches your Vercel production URL exactly (no trailing slash). Re-deploy the Render service after changing it.

**"Unable to log in" on first Vercel deploy**
The Render free tier backend might be cold-starting. Wait 60 seconds and retry. Check the Render service logs to confirm the process is running.

**`asyncpg` installation failure on Render**
The `asyncpg==0.30.0` version requires Python 3.11 (set via `PYTHON_VERSION` env var in `render.yaml`). If the build fails, check the build logs for the Python version being used.

**Pinecone index not found**
The backend creates the index on startup if missing. Check the Render startup logs for `Pinecone index 'weightwaise' created.` or any Pinecone errors.

**Seed user not created**
Ensure `SEED_USER_USERNAME=niloufar` and `SEED_USER_PASSWORD=Niloufar@2026!` are both set in Render env. The seed only runs if both are non-empty, and is idempotent (won't recreate an existing user).

---

## Cost summary (free tier)

| Service | Free tier | Upgrade path |
|---------|-----------|--------------|
| Vercel | Hobby plan — unlimited deploys, no cost | $20/mo if you exceed limits (unlikely for this app) |
| Render web | 750 hrs/mo with spin-down | Starter $7/mo for always-on |
| Render Postgres | 90-day expiry, 256 MB | Basic-256MB $7/mo for permanence |
| Pinecone | 1 serverless index up to 2GB | Paid tier only if you exceed 2GB |
| Gemini API | Free tier rate limits | Pay-per-use beyond |

**Total to share with a friend for testing: $0.**
**Total for production-grade (no cold start, no 90-day expiry): ~$14/mo.**
