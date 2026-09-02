import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain, ListOrdered, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickLoginButton } from "@/components/quick-login-button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillMatch AI — Explainable AI Resume Screening" },
      {
        name: "description",
        content:
          "SkillMatch AI screens a batch of resumes against your job description and returns a ranked shortlist with matched skills, gaps, and a written rationale for every score.",
      },
      { property: "og:title", content: "SkillMatch AI — Explainable AI Resume Screening" },
      {
        property: "og:description",
        content:
          "Turn a job description and a pile of resumes into a ranked, explainable shortlist in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: ScanSearch,
    title: "Parse the JD",
    body: "Required skills, nice-to-haves, experience level and education are extracted into a rubric you can sanity-check.",
  },
  {
    icon: Brain,
    title: "Score every resume",
    body: "A deterministic keyword overlap score is blended with an LLM contextual score, so the number is defensible.",
  },
  {
    icon: ListOrdered,
    title: "Review a ranked list",
    body: "Matched vs. missing skills, a rationale, one strength and one concern per candidate — shortlist or reject inline.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="bg-brand-gradient pointer-events-none absolute -top-52 left-1/2 size-[44rem] -translate-x-1/2 rounded-full opacity-15 blur-3xl" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2">
          <span className="bg-brand-gradient flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
          <span className="font-semibold tracking-tight">SkillMatch AI</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-5 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto max-w-3xl pt-16 text-center md:pt-24"
        >
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            Decision support, not auto-reject
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            An <span className="text-gradient-brand">explainable</span> first pass on every resume
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Paste a job description, drop in a batch of resumes, and get a ranked shortlist where
            every score is backed by matched skills, missing skills and a written rationale.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start screening</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Recruiter sign in</Link>
            </Button>
          </div>
        </motion.section>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              className="surface-card p-6 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="bg-accent flex size-10 items-center justify-center rounded-lg">
                <step.icon className="size-5 text-accent-foreground" />
              </span>
              <h2 className="mt-4 text-base font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
}
