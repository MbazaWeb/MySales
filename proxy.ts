import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Let auth/callback through without session refresh interference
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.*\\.png|favicon\\.svg|logo\\.png|app-icon\\.png|apple-touch-icon\\.png|manifest\\.json|public/).*)",
  ],
};
