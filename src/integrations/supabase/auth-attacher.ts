import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/**
 * Attaches the current Supabase access token to every server-function call so
 * `requireSupabaseAuth` can validate the caller.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined") return next();

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return next({ headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      // fall through unauthenticated; the server decides
    }

    return next();
  },
);
