import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount } from "@/lib/demo.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | SkillMatch AI Resume Screening" },
      {
        name: "description",
        content:
          "Sign in to SkillMatch AI to screen resumes against your job descriptions and review a ranked, explainable shortlist.",
      },
      { property: "og:title", content: "Sign in | SkillMatch AI" },
      {
        property: "og:description",
        content: "Recruiter sign-in for AI-assisted resume screening and ranked shortlists.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const prepareDemo = useServerFn(ensureDemoAccount);

  async function quickLogin() {
    setDemoBusy(true);
    try {
      const demo = await prepareDemo({ data: undefined });
      const { error } = await supabase.auth.signInWithPassword({
        email: demo.email,
        password: demo.password,
      });
      if (error) throw error;
      toast.success(demo.seeded ? "Demo workspace ready" : "Signed in to the demo workspace");
      router.navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quick login failed");
    } finally {
      setDemoBusy(false);
    }
  }


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        router.navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created — you can sign in now");
        setMode("signin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="bg-brand-gradient pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-15 blur-3xl" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="surface-card relative w-full max-w-sm p-7"
      >
        <div className="flex items-center gap-2">
          <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-lg">
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-lg leading-tight font-semibold tracking-tight">SkillMatch AI</h1>
            <p className="text-xs text-muted-foreground">Recruiter access</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signin"
            ? "First time here? Create the recruiter account"
            : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}
