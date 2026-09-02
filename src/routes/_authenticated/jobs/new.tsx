import { useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJobDescription } from "@/lib/jobs.functions";
import { ACCEPTED_DOC_TYPES, ExtractError, extractTextFromFile } from "@/lib/extract-text";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  head: () => ({
    meta: [
      { title: "New job description | SkillMatch AI" },
      {
        name: "description",
        content:
          "Paste a job description and let SkillMatch AI extract required skills, preferred skills, experience and education requirements.",
      },
      { property: "og:title", content: "New job description | SkillMatch AI" },
      {
        property: "og:description",
        content: "Create a job description and auto-extract its screening rubric.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewJobPage,
});

function NewJobPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useServerFn(createJobDescription);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ingestFile(file: File) {
    setReading(true);
    try {
      const text = await extractTextFromFile(file);
      setRawText(text);
      setFileName(file.name);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 80));
      }
      toast.success(`Read ${text.length.toLocaleString()} characters from ${file.name}`);
    } catch (error) {
      toast.error(
        error instanceof ExtractError
          ? error.message
          : "Could not read that file. Paste the text instead.",
      );
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }


  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rawText.trim().length < 40) {
      toast.error("Paste a bit more of the job description (at least 40 characters).");
      return;
    }
    setBusy(true);
    try {
      const result = await create({
        data: { raw_text: rawText.trim(), title: title.trim(), company: company.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (result.parseWarning) {
        toast.warning(result.parseWarning);
      } else {
        toast.success("Job description parsed");
      }
      router.navigate({ to: "/jobs/$jobId", params: { jobId: result.jobDescription.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create job description");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/jobs">
          <ArrowLeft className="size-4" />
          Back to job descriptions
        </Link>
      </Button>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="surface-card space-y-5 p-6"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New job description</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste the JD text. The AI extracts required skills, preferred skills, minimum experience
            and education so you can review the rubric before screening resumes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Role title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="raw">Job description text</Label>
          <Textarea
            id="raw"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the full job description here…"
            className="min-h-72 leading-relaxed"
            required
          />
          <p className="text-xs text-muted-foreground">{rawText.trim().length} characters</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Parsing with AI…" : "Parse & save"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
