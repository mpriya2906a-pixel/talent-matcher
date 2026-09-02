import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, FileText, Gauge, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/jobs.functions";
import { CountUp } from "@/components/count-up";
import { SectionSkeleton } from "@/components/section-skeleton";

const statsQuery = queryOptions({
  queryKey: ["dashboard-stats"],
  queryFn: () => getDashboardStats(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Screening overview | SkillMatch AI" },
      {
        name: "description",
        content:
          "Track job descriptions, resumes screened, and average match scores across your hiring pipeline.",
      },
      { property: "og:title", content: "Screening overview | SkillMatch AI" },
      {
        property: "og:description",
        content: "Recruiter overview of job descriptions, resumes screened, and match scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
  pendingComponent: () => <SectionSkeleton />,
  errorComponent: ({ error }) => (
    <p className="text-sm text-destructive">Couldn't load your overview: {error.message}</p>
  ),
});

function DashboardPage() {
  const { data } = useSuspenseQuery(statsQuery);

  const cards = [
    { label: "Job descriptions", value: data.jobCount, icon: Briefcase, suffix: "" },
    { label: "Resumes screened", value: data.candidateCount, icon: FileText, suffix: "" },
    { label: "Analyses completed", value: data.analyzedCount, icon: Users, suffix: "" },
    {
      label: "Avg. score this week",
      value: data.averageScoreThisWeek === null ? 0 : Math.round(data.averageScoreThisWeek),
      icon: Gauge,
      suffix: data.averageScoreThisWeek === null ? "" : "%",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screening overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI first-pass on every resume, ranked and explained.
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="size-4" />
            New job description
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="surface-card p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {card.label}
              </p>
              <card.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              <CountUp value={card.value} />
              {card.suffix}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="surface-card p-5">
        <h2 className="text-sm font-semibold tracking-tight">Recent activity</h2>
        {data.recentCandidates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No resumes yet. Create a job description, then upload a batch of resumes to screen.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.recentCandidates.map((candidate, index) => (
              <motion.li
                key={candidate.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="truncate text-sm">{candidate.full_name ?? "Unnamed candidate"}</span>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {candidate.status}
                </Badge>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
