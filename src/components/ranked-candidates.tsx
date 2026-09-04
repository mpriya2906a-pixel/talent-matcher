import { useState } from "react";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  Loader2,
  Sparkles,
  ThumbsUp,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { listRankedCandidates } from "@/lib/jobs.functions";
import { deleteCandidate, getResumeUrl } from "@/lib/candidates.functions";
import { scoreBand, scoreChipClass, scoreStrokeVar, scoreTextClass } from "@/lib/score";

export const rankedCandidatesQuery = (jobId: string) =>
  queryOptions({
    queryKey: ["ranked-candidates", jobId],
    queryFn: () => listRankedCandidates({ data: { jobId } }),
  });

function CandidateActions({ candidateId, jobId }: { candidateId: string; jobId: string }) {
  const queryClient = useQueryClient();
  const signUrl = useServerFn(getResumeUrl);
  const remove = useServerFn(deleteCandidate);
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);

  async function openResume() {
    setBusy("download");
    try {
      const { url } = await signUrl({ data: { candidateId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't open the resume");
    } finally {
      setBusy(null);
    }
  }

  async function removeCandidate() {
    if (!window.confirm("Remove this candidate and their stored resume?")) return;
    setBusy("delete");
    try {
      await remove({ data: { candidateId } });
      await queryClient.invalidateQueries({ queryKey: ["ranked-candidates", jobId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Candidate removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove the candidate");
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={openResume} disabled={busy !== null}>
        {busy === "download" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Resume
      </Button>
      <Button variant="ghost" size="sm" onClick={removeCandidate} disabled={busy !== null}>
        <Trash2 className="size-4" />
        Remove
      </Button>
    </div>
  );
}


function ScoreRing({ score }: { score: number }) {
  const band = scoreBand(score);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative size-14 shrink-0">
      <svg viewBox="0 0 56 56" className="size-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="5" className="stroke-muted" />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={scoreStrokeVar[band]}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${scoreTextClass[band]}`}
      >
        <CountUp value={score} />
      </span>
    </div>
  );
}

export function RankedCandidates({ jobId }: { jobId: string }) {
  const { data } = useSuspenseQuery(rankedCandidatesQuery(jobId));
  const [openId, setOpenId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm font-medium">No resumes screened yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Once resumes are uploaded for this role, ranked candidates appear here with scores and
          rationale.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">
          Ranked shortlist
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {data.length} candidate{data.length === 1 ? "" : "s"}
          </span>
        </h2>
      </div>

      <motion.ul layout className="space-y-3">
        {data.map((candidate, index) => {
          const score = candidate.overall_score ?? 0;
          const band = scoreBand(score);
          const open = openId === candidate.id;

          return (
            <motion.li
              layout
              key={candidate.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className="surface-card overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : candidate.id)}
                className="flex w-full items-center gap-4 text-left"
              >
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  #{index + 1}
                </span>
                <ScoreRing score={score} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {candidate.full_name ?? "Unnamed candidate"}
                    </span>
                    <Badge className={`border-0 font-normal ${scoreChipClass[band]}`}>
                      {band === "high" ? "Strong match" : band === "mid" ? "Possible" : "Weak match"}
                    </Badge>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {candidate.total_experience_years
                      ? `${candidate.total_experience_years} yrs experience · `
                      : ""}
                    {candidate.email ?? "no email parsed"}
                  </span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {candidate.ai_summary ? (
                        <p className="flex gap-2 text-sm leading-relaxed">
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                          {candidate.ai_summary}
                        </p>
                      ) : null}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Matched skills
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.matched_skills.length === 0 ? (
                              <p className="text-sm text-muted-foreground">None</p>
                            ) : (
                              candidate.matched_skills.map((skill, i) => (
                                <motion.span
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.16, delay: i * 0.03 }}
                                >
                                  <Badge className="bg-score-high-soft text-score-high border-0 font-normal">
                                    {skill}
                                  </Badge>
                                </motion.span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Missing skills
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {candidate.missing_skills.length === 0 ? (
                              <p className="text-sm text-muted-foreground">None</p>
                            ) : (
                              candidate.missing_skills.map((skill, i) => (
                                <motion.span
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.16, delay: i * 0.03 }}
                                >
                                  <Badge className="bg-score-low-soft text-score-low border-0 font-normal">
                                    {skill}
                                  </Badge>
                                </motion.span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {candidate.strengths ? (
                          <div>
                            <p className="text-score-high flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                              <ThumbsUp className="size-3.5" />
                              Strengths
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed">{candidate.strengths}</p>
                          </div>
                        ) : null}
                        {candidate.concerns ? (
                          <div>
                            <p className="text-score-mid flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                              <TriangleAlert className="size-3.5" />
                              Concerns
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed">{candidate.concerns}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                        {candidate.keyword_score !== null && candidate.semantic_score !== null ? (
                          <p className="text-xs text-muted-foreground">
                            Keyword overlap {Math.round(candidate.keyword_score)} · Contextual{" "}
                            {Math.round(candidate.semantic_score)} · Blended {Math.round(score)}
                          </p>
                        ) : (
                          <span />
                        )}
                        <CandidateActions candidateId={candidate.id} jobId={jobId} />
                      </div>

                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
