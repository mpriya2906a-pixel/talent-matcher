import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ACCEPTED_DOC_TYPES, MAX_DOC_BYTES, extractTextFromFile } from "@/lib/extract-text";
import { screenResume } from "@/lib/candidates.functions";
import { scoreTextClass, scoreBand } from "@/lib/score";

const MAX_FILES = 20;

type Item = {
  id: string;
  name: string;
  stage: "queued" | "reading" | "uploading" | "scoring" | "done" | "error";
  score?: number;
  message?: string;
};

const STAGE_LABEL: Record<Item["stage"], string> = {
  queued: "Queued",
  reading: "Extracting text…",
  uploading: "Uploading…",
  scoring: "AI screening…",
  done: "Scored",
  error: "Failed",
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

export function ResumeDropzone({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const screen = useServerFn(screenResume);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  const done = items.filter((i) => i.stage === "done" || i.stage === "error").length;

  function patch(id: string, next: Partial<Item>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }

  async function process(files: File[]) {
    const accepted = files.slice(0, MAX_FILES);
    if (files.length > MAX_FILES) {
      toast.warning(`Only the first ${MAX_FILES} resumes were queued.`);
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      toast.error("Your session expired — please sign in again.");
      return;
    }

    const queued: Item[] = accepted.map((file) => ({
      id: `${file.name}-${crypto.randomUUID()}`,
      name: file.name,
      stage: "queued",
    }));
    setItems(queued);
    setRunning(true);

    let scored = 0;

    for (let index = 0; index < accepted.length; index += 1) {
      const file = accepted[index]!;
      const item = queued[index]!;
      try {
        if (file.size > MAX_DOC_BYTES) {
          throw new Error("File is larger than 5MB");
        }

        patch(item.id, { stage: "reading" });
        const text = await extractTextFromFile(file);

        patch(item.id, { stage: "uploading" });
        const path = `${userId}/${jobId}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (uploadError) throw new Error(uploadError.message);

        patch(item.id, { stage: "scoring" });
        const result = await screen({
          data: { jobId, filePath: path, fileName: file.name, rawText: text },
        });

        scored += 1;
        patch(item.id, {
          stage: "done",
          score: result.overallScore,
          message: result.warning ?? undefined,
        });
      } catch (error) {
        patch(item.id, {
          stage: "error",
          message: error instanceof Error ? error.message : "Screening failed",
        });
      }
    }

    setRunning(false);
    await queryClient.invalidateQueries({ queryKey: ["ranked-candidates", jobId] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });

    if (scored > 0) {
      toast.success(`${scored} resume${scored === 1 ? "" : "s"} screened and ranked`);
    } else {
      toast.error("No resumes could be screened — check the errors below.");
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Screen resumes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop up to {MAX_FILES} PDF, DOCX or TXT resumes (5MB each). Each one is parsed, scored
            and ranked against this role.
          </p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={running}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {running ? "Screening…" : "Select resumes"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_DOC_TYPES}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void process(files);
        }}
      />

      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          if (!running) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (running) return;
          const files = Array.from(event.dataTransfer.files ?? []);
          if (files.length) void process(files);
        }}
        animate={{
          borderColor: dragging ? "var(--primary)" : "var(--border)",
          backgroundColor: dragging ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "transparent",
          scale: dragging ? 1.01 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center"
        onClick={() => !running && inputRef.current?.click()}
      >
        <motion.div animate={{ y: dragging ? -4 : 0 }} transition={{ duration: 0.15 }}>
          <Upload className="size-6 text-primary" />
        </motion.div>
        <p className="text-sm font-medium">Drag resumes here</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — text-based files only</p>
      </motion.div>

      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          <Progress value={(done / items.length) * 100} className="h-1.5" />
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.message ?? STAGE_LABEL[item.stage]}
                  </p>
                </div>
                {item.stage === "done" ? (
                  <span
                    className={`flex items-center gap-1 text-sm font-semibold ${item.score !== undefined ? scoreTextClass[scoreBand(item.score)] : ""}`}
                  >
                    <CheckCircle2 className="size-4" />
                    {item.score?.toFixed(1)}
                  </span>
                ) : item.stage === "error" ? (
                  <TriangleAlert className="size-4 shrink-0 text-destructive" />
                ) : (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {!running ? (
            <Button variant="ghost" size="sm" onClick={() => setItems([])}>
              <X className="size-4" />
              Clear list
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
