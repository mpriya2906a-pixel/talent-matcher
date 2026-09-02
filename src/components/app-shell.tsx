import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Job descriptions", icon: Briefcase },
] as const;

export function AppShell({ children, email }: { children: ReactNode; email?: string | undefined }) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col md:flex-row">
        <aside className="border-b border-sidebar-border bg-sidebar px-4 py-4 md:min-h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0 md:px-4 md:py-6">
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <span className="bg-brand-gradient flex size-8 items-center justify-center rounded-lg">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <span className="text-base font-semibold tracking-tight">SkillMatch AI</span>
          </Link>

          <nav className="mt-6 flex gap-1 md:flex-col">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group relative flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
                activeProps={{ "data-status": "active" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 hidden md:block">
            <div className="surface-card p-3">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="mt-1 truncate text-sm font-medium">{email ?? "recruiter"}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-2 px-4 py-3 md:px-8">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="md:hidden" onClick={signOut}>
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn("px-4 pb-16 md:px-8")}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
