# AI Workforce Scheduling Dashboard

End-to-end MVP that predicts how many workers a factory needs and assigns them
to shifts. Built with **FastAPI + scikit-learn + SQLite** on the backend and
**Next.js + Tailwind** on the frontend.

```
ai-workforce-scheduler/
├── backend/          # FastAPI + ML
│   ├── app/
│   │   ├── ml/       # data generator, training, predictor, optimizer
│   │   ├── routes/   # /employees, /predict, /schedule, /dashboard
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── main.py
│   │   └── seed.py
│   ├── data/         # CSV, SQLite DB, joblib model (gitignored)
│   └── requirements.txt
└── frontend/         # Next.js 14 (App Router)
    └── src/
        ├── app/      # dashboard, employees, production, schedule
        ├── components/
        └── lib/api.ts
```

## Phase map

The build follows the roadmap you outlined:

| Phase | Where it lives |
|------:|----------------|
| 1. Understand problem | This README |
| 2. Gather data | `backend/app/ml/generate_data.py` |
| 3. Design DB | `backend/app/models.py` |
| 4. Train AI | `backend/app/ml/train.py` |
| 5. Optimize shifts | `backend/app/ml/optimizer.py` |
| 6. Backend API | `backend/app/main.py` + `backend/app/routes/` |
| 7. Dashboard | `frontend/src/app/` |
| 8. Deployment | See *Deploy* section below |

---

## 1 · Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Generate the dataset (Phase 2)

```bash
python -m app.ml.generate_data
# → wrote 1000 rows to backend/data/manufacturing.csv
```

### Train the model (Phase 4)

```bash
python -m app.ml.train
# R²  : 0.94x
# MAE : ~0.9 workers
# Saved model to backend/data/workforce_model.joblib
```

### Seed some employees (Phase 3)

```bash
python -m app.seed
# Seeded 20 employees.
```

### Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the auto-generated Swagger UI.

Quick smoke test:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"production_target":1200,"orders":20,"machines":8,"available_workers":28,"average_skill":4.0,"overtime":3}'
```

## 2 · Frontend setup

In a second terminal:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit http://localhost:3000.

Pages:
- `/` — dashboard summary cards
- `/employees` — add / list / delete employees
- `/production` — enter a plan, run the AI prediction
- `/schedule` — distribute workers across morning / afternoon / night

## 3 · End-to-end test (the 60-second demo)

1. Open `/employees` and confirm the 20 seeded workers appear.
2. Open `/production`, click **Predict Workforce** → you get e.g. `21 workers`.
3. Open `/schedule`, type `21`, click **Generate Schedule** → workers fan out
   across three shifts; total cost shows at the top right.
4. Return to `/` → the dashboard now reflects the latest prediction.

## 4 · Deploy (Neon + Render + Vercel)

The repo is wired so you can deploy straight from GitHub. Three services, all
free-tier friendly:

```
Browser → Vercel (Next.js)
              ↓ NEXT_PUBLIC_API_BASE
         Render (FastAPI + scikit-learn)
              ↓ DATABASE_URL
         Neon (Postgres)
```

### Step 1 — Push to GitHub

```bash
cd ~/Desktop/gian/ai-workforce-scheduler
git init && git add . && git commit -m "Initial MVP"
git remote add origin https://github.com/<you>/ai-workforce-scheduler.git
git push -u origin main
```

### Step 2 — Create the Neon database

1. Sign up at https://neon.tech → **New Project** → region near you.
2. From the dashboard copy the **connection string** that ends in
   `?sslmode=require`. Keep this tab open.

### Step 3 — Deploy the backend to Render

1. https://render.com → **New +** → **Blueprint** → connect your GitHub repo.
   Render reads `render.yaml` at the repo root and proposes the `ai-workforce-api`
   service.
2. When prompted for secrets, paste these:
   - `DATABASE_URL` → the Neon connection string from Step 2.
   - `CORS_ORIGINS` → leave blank for now; you'll set it after Vercel.
   - `ADMIN_PASSWORD` → a strong password for the admin account.
   - `MANAGER_PASSWORD` → a strong password for the manager account.
   - `JWT_SECRET` → leave blank, Render auto-generates one.
3. Click **Apply**. Render runs:
   ```
   pip install -r requirements.txt
   python -m app.ml.generate_data
   python -m app.ml.train
   ```
   then starts the service with `python -m app.seed && uvicorn ...`.
   First deploy takes ~4 min.
4. When it's live, copy the URL (e.g. `https://ai-workforce-api.onrender.com`)
   and hit `/docs` to confirm Swagger loads. The lock icons next to most
   endpoints confirm auth is enforced.

### Step 4 — Deploy the frontend to Vercel

1. https://vercel.com → **Add New… → Project** → import the same repo.
2. In **Configure Project**:
   - **Root Directory:** `frontend`
   - **Environment Variable:** `NEXT_PUBLIC_API_BASE` = your Render URL from Step 3.
3. Click **Deploy**. Vercel auto-detects Next.js. ~90 seconds.
4. Copy your Vercel URL (e.g. `https://ai-workforce-scheduler.vercel.app`).

### Step 5 — Tell the backend to trust the frontend

1. Back in Render → your service → **Environment** → set
   `CORS_ORIGINS = https://ai-workforce-scheduler.vercel.app`
   (no trailing slash; comma-separate if you have multiple domains).
2. **Manual Deploy → Deploy latest commit** to pick up the new env var.

### Step 6 — Verify

1. Open your Vercel URL → you should hit the **login page**.
2. Sign in as `admin` / your `ADMIN_PASSWORD`.
3. `/employees` shows the 20 seeded workers.
4. `/production` → fill in the form → **Predict & Save Plan** → AI prediction
   appears and the plan is saved to the table below.
5. `/schedule` → set workers needed → **Generate Schedule** → assignments appear
   and are persisted to the DB. Click **Export PDF** to download today's roster.
6. `/analytics` → charts populate after a few predictions exist. Click
   **Export Predictions (Excel)** to download the prediction log.

If the dashboard says "Failed to load", check CORS in the browser console —
it almost always means `CORS_ORIGINS` doesn't match your Vercel URL exactly
(no trailing slash; include the full `https://...`).

### Heads-up

- **Render free tier sleeps after 15 min idle.** First request after a nap
  takes ~30–60 s while it cold-starts. Upgrade to the $7/mo plan to keep
  it warm, or switch to Railway.
- **Seed only runs when DB is empty** (`app/seed.py` checks count first),
  so redeploys won't duplicate employees.
- **No migrations yet.** Schema is created with `Base.metadata.create_all`.
  If you change `models.py`, drop the tables in Neon or add Alembic.

## 5 · What to build next (after the MVP)

- Save production plans into the DB and chart `predicted vs actual` workers.
- Replace the greedy optimizer with PuLP / OR-Tools and add real constraints
  (max consecutive shifts, mandatory rest, skill-per-shift minimums).
- Add authentication (NextAuth + a `users` table).
- Add an `/analytics` page with weekly cost trends — feeds your study chapter
  on results & evaluation.

---

Built for the AI Workforce Scheduling study. MVP, not production-ready.
