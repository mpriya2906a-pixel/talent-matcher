import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount } from "@/lib/demo.functions";

export function QuickLoginButton({
  size = "lg",
  variant = "default",
  label = "Try the live demo",
  className,
}: {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const prepareDemo = useServerFn(ensureDemoAccount);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const demo = await prepareDemo({ data: undefined });
      const { error } = await supabase.auth.signInWithPassword({
        email: demo.email,
        password: demo.password,
      });
      if (error) throw error;
      toast.success("Signed in to the demo workspace");
      router.navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quick login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size={size} variant={variant} onClick={run} disabled={busy} className={className}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
      {busy ? "Preparing demo…" : label}
    </Button>
  );
}
