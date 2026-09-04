import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clampScore, keywordMatch, overallScore } from "@/lib/match";

const screenSchema = z.object({
  jobId: z.string().uuid(),
  filePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(260),
  rawText: z.string().min(30, "Resume text is too short to screen").max(200000),
});

export type ScreenResult = {
  candidateId: string;
  fullName: string | null;
  overallScore: number;
  keywordScore: number;
  semanticScore: number;
  warning: string | null;
};

/**
 * Re-numbers rank (1 = best) for every scored candidate on a job so the
 * shortlist stays consistent after each new upload or re-analysis.
 */
async function rerank(
  supabase: { from: (t: "match_results") => any },
  jobId: string,
): Promise<void> {
  const { data } = await supabase
    .from("match_results")
    .select("id, overall_score")
    .eq("job_description_id", jobId);

  const ordered = [...(data ?? [])].sort(
    (a: any, b: any) => Number(b.overall_score) - Number(a.overall_score),
  );

  await Promise.all(
    ordered.map((row: any, index: number) =>
      supabase.from("match_results").update({ rank: index + 1 }).eq("id", row.id),
    ),
  );
}

/**
 * Full screening pipeline for one resume:
 * parse -> keyword score -> AI semantic score -> persist -> rerank.
 * The file itself is uploaded from the browser straight to private storage;
 * only the extracted text reaches this function.
 */
export const screenResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => screenSchema.parse(input))
  .handler(async ({ data, context }): Promise<ScreenResult> => {
    const { supabase, userId } = context;
    const { groqJson, toStringArray, toNumberOrNull, GroqError } = await import(
      "@/lib/groq.server"
    );

    const { data: job, error: jobError } = await supabase
      .from("job_descriptions")
      .select("id, title, role_summary, raw_text, required_skills, preferred_skills, min_experience_years, education_requirement")
      .eq("id", data.jobId)
      .maybeSingle();
    if (jobError) throw new Error(jobError.message);
    if (!job) throw new Error("Job description not found");

    const resumeText = data.rawText.slice(0, 24000);
    let warning: string | null = null;

    // --- Step 1: structured resume parsing -------------------------------
    let parsed = {
      full_name: null as string | null,
      email: null as string | null,
      phone: null as string | null,
      skills: [] as string[],
      education: null as unknown,
      experience: null as unknown,
      years: null as number | null,
    };

    try {
      const raw = await groqJson<Record<string, unknown>>({
        system:
          "You extract structured data from resumes. Respond with ONLY a JSON object with exactly these keys: " +
          '{"full_name": string|null, "email": string|null, "phone": string|null, "skills": string[], ' +
          '"education": [{"degree": string, "institution": string, "year": string|null}], ' +
          '"experience": [{"title": string, "company": string, "duration": string|null}], ' +
          '"total_experience_years": number|null}. ' +
          "Skills are short canonical names. total_experience_years is total professional years as a number.",
        user: `Resume:\n\n${resumeText}`,
      });

      parsed = {
        full_name: typeof raw["full_name"] === "string" ? (raw["full_name"] as string) : null,
        email: typeof raw["email"] === "string" ? (raw["email"] as string) : null,
        phone: typeof raw["phone"] === "string" ? (raw["phone"] as string) : null,
        skills: toStringArray(raw["skills"]),
        education: raw["education"] ?? null,
        experience: raw["experience"] ?? null,
        years: toNumberOrNull(raw["total_experience_years"]),
      };
    } catch (error) {
      if (!(error instanceof GroqError)) throw error;
      warning = `${error.message} — resume saved for manual review.`;
    }

    const fallbackEmail = parsed.email ?? resumeText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null;

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        job_description_id: data.jobId,
        user_id: userId,
        full_name: parsed.full_name ?? data.fileName.replace(/\.[^.]+$/, ""),
        email: fallbackEmail,
        phone: parsed.phone,
        file_path: data.filePath,
        file_name: data.fileName,
        raw_text: resumeText,
        parsed_skills: parsed.skills,
        parsed_education: (parsed.education ?? null) as never,
        parsed_experience: (parsed.experience ?? null) as never,
        total_experience_years: parsed.years,
        status: "processing",
        error_message: warning,
      })
      .select("id, full_name")
      .single();
    if (candidateError) throw new Error(candidateError.message);

    // --- Step 2: deterministic keyword coverage --------------------------
    const keyword = keywordMatch({
      requiredSkills: job.required_skills ?? [],
      preferredSkills: job.preferred_skills ?? [],
      candidateSkills: parsed.skills,
      candidateText: resumeText,
    });

    // --- Step 3: AI semantic judgement ----------------------------------
    let semanticScore = keyword.keywordScore;
    let aiSummary: string | null = null;
    let strengths: string | null = null;
    let concerns: string | null = null;

    try {
      const raw = await groqJson<Record<string, unknown>>({
        system:
          "You are a fair, evidence-based technical recruiter scoring one candidate against one role. " +
          "Respond with ONLY JSON: " +
          '{"semantic_score": number, "summary": string, "strengths": string, "concerns": string}. ' +
          "semantic_score is 0-100 and reflects overall fit (skill depth, relevance of experience, seniority, education). " +
          "summary is 1-2 sentences. strengths and concerns are 1-3 short sentences each, citing concrete resume evidence. " +
          "Never mention or infer gender, age, nationality, race or personal attributes — judge skills and experience only.",
        user:
          `ROLE: ${job.title}\n` +
          `SUMMARY: ${job.role_summary ?? "n/a"}\n` +
          `REQUIRED SKILLS: ${(job.required_skills ?? []).join(", ") || "n/a"}\n` +
          `PREFERRED SKILLS: ${(job.preferred_skills ?? []).join(", ") || "n/a"}\n` +
          `MIN EXPERIENCE (years): ${job.min_experience_years ?? "n/a"}\n` +
          `EDUCATION REQUIREMENT: ${job.education_requirement ?? "n/a"}\n\n` +
          `CANDIDATE RESUME:\n${resumeText.slice(0, 16000)}`,
        maxTokens: 900,
      });

      semanticScore = clampScore(toNumberOrNull(raw["semantic_score"]));
      aiSummary = typeof raw["summary"] === "string" ? (raw["summary"] as string) : null;
      strengths = typeof raw["strengths"] === "string" ? (raw["strengths"] as string) : null;
      concerns = typeof raw["concerns"] === "string" ? (raw["concerns"] as string) : null;
    } catch (error) {
      if (!(error instanceof GroqError)) throw error;
      warning =
        warning ??
        `${error.message} — scored on keyword coverage only, AI rationale unavailable.`;
      aiSummary = "AI rationale unavailable; score is based on keyword coverage only.";
    }

    const overall = overallScore(keyword.keywordScore, semanticScore);

    const { error: matchError } = await supabase.from("match_results").insert({
      candidate_id: candidate.id,
      job_description_id: data.jobId,
      user_id: userId,
      overall_score: overall,
      keyword_score: keyword.keywordScore,
      semantic_score: semanticScore,
      matched_skills: keyword.matchedSkills,
      missing_skills: keyword.missingSkills,
      ai_summary: aiSummary,
      strengths,
      concerns,
    });
    if (matchError) throw new Error(matchError.message);

    if (warning === null) {
      await supabase.from("candidates").update({ status: "scored" }).eq("id", candidate.id);
    }

    await rerank(supabase as never, data.jobId);

    return {
      candidateId: candidate.id,
      fullName: candidate.full_name,
      overallScore: overall,
      keywordScore: keyword.keywordScore,
      semanticScore,
      warning,
    };
  });

/** Removes a candidate, its score row and the stored resume file. */
export const deleteCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ candidateId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: candidate, error: readError } = await supabase
      .from("candidates")
      .select("id, file_path, job_description_id")
      .eq("id", data.candidateId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!candidate) throw new Error("Candidate not found");

    await supabase.from("match_results").delete().eq("candidate_id", candidate.id);
    const { error } = await supabase.from("candidates").delete().eq("id", candidate.id);
    if (error) throw new Error(error.message);

    if (candidate.file_path) {
      await supabase.storage.from("resumes").remove([candidate.file_path]);
    }

    await rerank(supabase as never, candidate.job_description_id);
    return { ok: true };
  });

/** Signed, short-lived download link for a stored resume. */
export const getResumeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ candidateId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: candidate, error } = await context.supabase
      .from("candidates")
      .select("file_path")
      .eq("id", data.candidateId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!candidate?.file_path) throw new Error("No resume file stored for this candidate");

    const { data: signed, error: signError } = await context.supabase.storage
      .from("resumes")
      .createSignedUrl(candidate.file_path, 60 * 5);
    if (signError) throw new Error(signError.message);

    return { url: signed.signedUrl };
  });
