# SkillMatch AI — build roadmap

- [x] Phase 1 — Schema + RLS + `resumes` storage bucket, design system, app shell, dark mode
- [x] Phase 2 — Auth (email/password) + JD create / list / detail with AI-parsed rubric (paste text or upload PDF/DOCX/TXT)
- [x] Phase 3 — Resume upload (drag-and-drop, PDF/DOCX/TXT, 5MB, up to 20), text extraction, AI resume parsing
- [x] Phase 4 — Matching engine: keyword score + LLM semantic score, `overall_score = 0.4k + 0.6s`, auto ranking
- [x] Demo data seeding + one-click recruiter quick login
- [x] Phase 5 — Ranked shortlist with expandable detail: summary, matched/missing skills, strengths, concerns, score breakdown, signed resume download, remove
- [x] Phase 6 — Animation polish (score reveal ring, staggered lists, layout reorder, skeletons)
- [x] Security scan clean (RLS on all tables, private bucket + owner-scoped storage policies)
- [x] Vercel deploy config (`vercel.json`) + `DEPLOYMENT.md`
- [ ] User action — connect GitHub in the editor, import repo on Vercel, set env vars
- [ ] User action — enable Supabase "Leaked password protection" (dashboard-only toggle)
