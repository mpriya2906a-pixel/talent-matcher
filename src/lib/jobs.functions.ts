import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ParsedJd = {
  title: string | null;
  company: string | null;
  role_summary: string | null;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number | null;
  education_requirement: string | null;
};

const createSchema = z.object({
  raw_text: z.string().min(40, "Job description text is too short"),
  title: z.string().trim().max(160).optional(),
  company: z.string().trim().max(160).optional(),
});

export const listJobDescriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_descriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((jd) => jd.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      const { data: cands } = await context.supabase
        .from("candidates")
        .select("job_description_id")
        .in("job_description_id", ids);
      for (const row of cands ?? []) {
        counts[row.job_description_id] = (counts[row.job_description_id] ?? 0) + 1;
      }
    }

    return (data ?? []).map((jd) => ({ ...jd, candidate_count: counts[jd.id] ?? 0 }));
  });

export const getJobDescription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: jd, error } = await context.supabase
      .from("job_descriptions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!jd) throw new Error("Job description not found");
    return jd;
  });

export const createJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { groqJson, toStringArray, toNumberOrNull, GroqError } = await import(
      "@/lib/groq.server"
    );

    let parsed: ParsedJd = {
      title: null,
      company: null,
      role_summary: null,
      required_skills: [],
      preferred_skills: [],
      min_experience_years: null,
      education_requirement: null,
    };
    let parseWarning: string | null = null;

    try {
      const raw = await groqJson<Record<string, unknown>>({
        system:
          "You are an expert technical recruiter that extracts structured data from job descriptions. " +
          "Respond with ONLY a JSON object using exactly these keys: " +
          '{"title": string|null, "company": string|null, "role_summary": string, ' +
          '"required_skills": string[], "preferred_skills": string[], ' +
          '"min_experience_years": number|null, "education_requirement": string|null}. ' +
          "Skills must be short canonical names (e.g. 'React', 'PostgreSQL', 'Leadership'). " +
          "role_summary is 1-2 sentences.",
        user: `Job description:\n\n${data.raw_text.slice(0, 20000)}`,
      });

      parsed = {
        title: typeof raw["title"] === "string" ? (raw["title"] as string) : null,
        company: typeof raw["company"] === "string" ? (raw["company"] as string) : null,
        role_summary:
          typeof raw["role_summary"] === "string" ? (raw["role_summary"] as string) : null,
        required_skills: toStringArray(raw["required_skills"]),
        preferred_skills: toStringArray(raw["preferred_skills"]),
        min_experience_years: toNumberOrNull(raw["min_experience_years"]),
        education_requirement:
          typeof raw["education_requirement"] === "string"
            ? (raw["education_requirement"] as string)
            : null,
      };
    } catch (error) {
      if (error instanceof GroqError) {
        parseWarning = `${error.message} — saved without AI extraction, needs manual review.`;
      } else {
        throw error;
      }
    }

    const title =
      data.title?.trim() || parsed.title?.trim() || data.raw_text.trim().slice(0, 80) || "Untitled role";

    const { data: inserted, error } = await context.supabase
      .from("job_descriptions")
      .insert({
        user_id: context.userId,
        title,
        company: data.company?.trim() || parsed.company,
        raw_text: data.raw_text,
        role_summary: parsed.role_summary,
        required_skills: parsed.required_skills,
        preferred_skills: parsed.preferred_skills,
        min_experience_years: parsed.min_experience_years,
        education_requirement: parsed.education_requirement,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { jobDescription: inserted, parseWarning };
  });

export const reparseJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { groqJson, toStringArray, toNumberOrNull } = await import("@/lib/groq.server");

    const { data: jd, error: readError } = await context.supabase
      .from("job_descriptions")
      .select("id, raw_text")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!jd) throw new Error("Job description not found");

    const raw = await groqJson<Record<string, unknown>>({
      system:
        "Extract structured data from the job description. Respond with ONLY JSON: " +
        '{"role_summary": string, "required_skills": string[], "preferred_skills": string[], ' +
        '"min_experience_years": number|null, "education_requirement": string|null}.',
      user: `Job description:\n\n${jd.raw_text.slice(0, 20000)}`,
    });

    const { data: updated, error } = await context.supabase
      .from("job_descriptions")
      .update({
        role_summary: typeof raw["role_summary"] === "string" ? (raw["role_summary"] as string) : null,
        required_skills: toStringArray(raw["required_skills"]),
        preferred_skills: toStringArray(raw["preferred_skills"]),
        min_experience_years: toNumberOrNull(raw["min_experience_years"]),
        education_requirement:
          typeof raw["education_requirement"] === "string"
            ? (raw["education_requirement"] as string)
            : null,
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_descriptions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ count: jdCount }, { data: candidates }, { data: results }] = await Promise.all([
      context.supabase.from("job_descriptions").select("id", { count: "exact", head: true }),
      context.supabase
        .from("candidates")
        .select("id, full_name, status, created_at, job_description_id")
        .order("created_at", { ascending: false })
        .limit(8),
      context.supabase.from("match_results").select("overall_score, created_at"),
    ]);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = (results ?? []).filter((r) => new Date(r.created_at).getTime() >= weekAgo);
    const avgWeek = recent.length
      ? recent.reduce((sum, r) => sum + Number(r.overall_score), 0) / recent.length
      : null;

    const { count: totalCandidates } = await context.supabase
      .from("candidates")
      .select("id", { count: "exact", head: true });

    return {
      jobCount: jdCount ?? 0,
      candidateCount: totalCandidates ?? 0,
      analyzedCount: (results ?? []).length,
      averageScoreThisWeek: avgWeek,
      recentCandidates: candidates ?? [],
    };
  });
