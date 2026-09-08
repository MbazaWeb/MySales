/**
 * Public Supabase credentials.
 *
 * These are the project's PUBLISHABLE credentials — they are designed to be
 * embedded in browser bundles and are safe to commit. Data access is
 * protected by Row Level Security on every table (see supabase-schema.sql).
 * NEVER put the service_role key or sb_secret_* here.
 *
 * Values default to the DukaVerse project so deployments without configured
 * environment variables still work; set NEXT_PUBLIC_* to override.
 */
const FALLBACK_URL = "https://iokplwgvpgeuggmrfqhg.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlva3Bsd2d2cGdldWdnbXJmcWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Nzg1OTIsImV4cCI6MjEwNDQ1NDU5Mn0.Kf1zcrx6iRethfwYugRNkFm3leFPjQf6KsiKes1LlUM";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export function supabaseEnvError(): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }
  return null;
}
