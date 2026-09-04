# Deploying SkillMatch AI (GitHub → Vercel)

## 1. Push to GitHub

In the Lovable editor: **GitHub → Connect to GitHub**, then create the repository.
Every change you make afterwards syncs automatically.

## 2. Import the repo on Vercel

1. Go to vercel.com → **Add New → Project** → pick the repo.
2. Framework preset: **Other** (the repo's `vercel.json` already sets the build).
3. Leave the output directory blank — the build emits Vercel's own
   `.vercel/output` bundle via `NITRO_PRESET=vercel`.

## 3. Environment variables (Project → Settings → Environment Variables)

Add all of these to **Production**, **Preview** and **Development**:

| Name                            | Where to find it                                       | Exposed to browser |
| ------------------------------- | ------------------------------------------------------ | ------------------ |
| `VITE_SUPABASE_URL`             | Supabase → Project Settings → Data API                 | yes (safe)         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (publishable)   | yes (safe)         |
| `SUPABASE_URL`                  | same value as `VITE_SUPABASE_URL`                      | no                 |
| `SUPABASE_PUBLISHABLE_KEY`      | same value as `VITE_SUPABASE_PUBLISHABLE_KEY`          | no                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → API Keys → **secret** key                   | no — never commit  |
| `GROQ_API_KEY`                  | console.groq.com → API Keys                            | no — never commit  |

The exact values are in this project's `.env` file (which is git-ignored on purpose).

## 4. Supabase settings for the deployed URL

1. **Authentication → URL Configuration**: set Site URL to your Vercel domain and add
   `https://<your-app>.vercel.app/**` to Redirect URLs, or email login links will
   bounce back to localhost.
2. **Authentication → Policies**: turn on **Leaked password protection** (the one
   remaining item from the security scan — it can only be toggled in the dashboard).

## 5. Smoke test the deployment before sharing it

- Landing page loads → **Quick login with demo data** signs you in and seeds 3 roles
  with a ranked shortlist.
- Create a job by pasting text **and** by uploading a PDF/DOCX JD.
- Open a role, drop a resume PDF, confirm it parses, scores, and ranks.
- Expand a candidate → summary, matched/missing skills, strengths, concerns,
  score breakdown, resume download, remove.

## Notes

- The model used for parsing and scoring is Groq `openai/gpt-oss-120b`.
- Resumes live in a **private** Supabase Storage bucket; the app hands out
  5-minute signed URLs, so files are never publicly readable.
- All tables have row-level security scoped to the owning recruiter's `auth.uid()`.
