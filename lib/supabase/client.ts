/**
 * Supabase browser client — use in Client Components.
 * Falls back to the project's publishable defaults via ./env.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
