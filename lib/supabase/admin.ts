/**
 * Supabase Admin client — uses the SERVICE ROLE KEY.
 * ONLY import this in Server Actions / Route Handlers.
 * NEVER expose to the browser.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to your .env.local — find it in " +
      "Supabase → Settings → API → service_role key."
    );
  }

  return createClient<Database>(url, secret, {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
    },
  });
}
