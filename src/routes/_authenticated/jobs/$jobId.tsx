import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  RefreshCw,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionSkeleton } from "@/components/section-skeleton";
import { ResumeDropzone } from "@/components/resume-dropzone";
import { RankedCandidates, rankedCandidatesQuery } from "@/components/ranked-candidates";

import {
  deleteJobDescription,
  getJobDescription,
  reparseJobDescription,
} from "@/lib/jobs.functions";

const jobQuery = (jobId: string) =>
  queryOptions({
    queryKey: ["job-description", jobId],
    queryFn: () => getJobDescription({ data: { id: jobId } }),
  });

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job description breakdown | SkillMatch AI" },
      {
        name: "description",
        content:
          "Review the AI-extracted screening rubric for this role: required skills, preferred skills, experience level and education requirement.",
      },
      { property: "og:title", content: "Job description breakdown | SkillMatch AI" },
      {
        property: "og:description",
        content: "AI-extracted screening rubric for this role before resumes are uploaded.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(jobQuery(params.jobId)),
      context.queryClient.ensureQueryData(rankedCandidatesQuery(params.jobId)),
    ]);
  },
  component: JobDetailPage,
  pendingComponent: () => <SectionSkeleton />,
  errorComponent: ({ error }) => (
    <p className="text-sm text-destructive">Couldn't load this job description: {error.message}</p>
  ),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Job description not found.</p>,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQuery(jobId));
  const router = useRouter();
  const queryClient = useQueryClient();
  const reparse = useServerFn(reparseJobDescription);
  const remove = useServerFn(deleteJobDescription);
  const [busy, setBusy] = useState<"reparse" | "delete" | null>(null);

  async function handleReparse() {
    setBusy("reparse");
    try {
      await reparse({ data: { id: jobId } });
      await queryClient.invalidateQueries({ queryKey: ["job-description", jobId] });
      toast.success("Rubric re-extracted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-parsing failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this job description and all its candidates?")) return;
    setBusy("delete");
    try {
      await remove({ data: { id: jobId } });
      await queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
      toast.success("Job description deleted");
      router.navigate({ to: "/jobs" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
      setBusy(null);
    }
  }

  const hasRubric = job.required_skills.length > 0 || job.preferred_skills.length > 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/jobs">
          <ArrowLeft className="size-4" />
          Back to job descriptions
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{job.company ?? "No company set"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleReparse} disabled={busy !== null}>
            {busy === "reparse" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Re-extract rubric
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={busy !== null}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      {job.role_summary ? (
        <div className="surface-card p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Role summary
          </p>
          <p className="mt-2 text-sm leading-relaxed">{job.role_summary}</p>
        </div>
      ) : null}

      {!hasRubric ? (
        <div className="surface-card border-score-mid/40 p-5">
          <p className="text-sm font-medium text-score-mid">Needs manual review</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The AI couldn't extract a skills rubric from this JD. Try re-extracting, or edit the JD
            text and create it again.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Required skills
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.required_skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">None extracted.</p>
            ) : (
              job.required_skills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: index * 0.03 }}
                >
                  <Badge className="font-normal">{skill}</Badge>
                </motion.span>
              ))
            )}
          </div>

          <Separator className="my-4" />

          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Preferred skills
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.preferred_skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">None extracted.</p>
            ) : (
              job.preferred_skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="font-normal">
                  {skill}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-card flex items-start gap-3 p-5">
            <Timer className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Minimum experience
              </p>
              <p className="mt-1 text-sm">
                {job.min_experience_years === null
                  ? "Not specified"
                  : `${job.min_experience_years} year${Number(job.min_experience_years) === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <div className="surface-card flex items-start gap-3 p-5">
            <GraduationCap className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Education requirement
              </p>
              <p className="mt-1 text-sm">{job.education_requirement ?? "Not specified"}</p>
            </div>
          </div>

        </div>
      </div>

      <ResumeDropzone jobId={jobId} />

      <RankedCandidates jobId={jobId} />


      <details className="surface-card p-5">
        <summary className="cursor-pointer text-sm font-medium">Original JD text</summary>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {job.raw_text}
        </p>
      </details>
    </div>
  );
}
