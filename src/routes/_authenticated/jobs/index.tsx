import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listJobDescriptions } from "@/lib/jobs.functions";
import { SectionSkeleton } from "@/components/section-skeleton";

export const jobsQuery = queryOptions({
  queryKey: ["job-descriptions"],
  queryFn: () => listJobDescriptions(),
});

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({
    meta: [
      { title: "Job descriptions | SkillMatch AI" },
      {
        name: "description",
        content:
          "Manage the job descriptions you screen resumes against, with AI-extracted required and preferred skills.",
      },
      { property: "og:title", content: "Job descriptions | SkillMatch AI" },
      {
        property: "og:description",
        content: "Manage job descriptions and their AI-extracted skill requirements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
  pendingComponent: () => <SectionSkeleton />,
  errorComponent: ({ error }) => (
    <p className="text-sm text-destructive">Couldn't load job descriptions: {error.message}</p>
  ),
});

function JobsPage() {
  const { data: jobs } = useSuspenseQuery(jobsQuery);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job descriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each JD is parsed into a skills rubric that every resume is scored against.
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="size-4" />
            New job description
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center"
        >
          <span className="bg-accent flex size-11 items-center justify-center rounded-xl">
            <Briefcase className="size-5 text-accent-foreground" />
          </span>
          <h2 className="text-base font-semibold">No job descriptions yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Paste a JD and SkillMatch AI will extract required skills, preferred skills, experience
            level and education requirement so you can sanity-check the rubric before uploading
            resumes.
          </p>
          <Button asChild className="mt-2">
            <Link to="/jobs/new">
              <Plus className="size-4" />
              Create your first JD
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/jobs/$jobId"
                params={{ jobId: job.id }}
                className="surface-card flex h-full flex-col p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight">{job.title}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {job.company ?? "No company set"}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {job.role_summary ?? job.raw_text.slice(0, 160)}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.required_skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-normal">
                      {skill}
                    </Badge>
                  ))}
                  {job.required_skills.length > 4 ? (
                    <Badge variant="outline" className="font-normal">
                      +{job.required_skills.length - 4}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {job.candidate_count} {job.candidate_count === 1 ? "resume" : "resumes"}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
