import React, { createContext, useContext } from "react";
import { useAuth } from "./supabase/hooks";

type Ctx = Awaited<ReturnType<typeof import("./supabase/api").getActiveBranch>>;

const AuthCtx = createContext<{
  ctx:     Ctx;
  loading: boolean;
  refresh: () => void;
}>({ ctx: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthCtx.Provider value={auth}>{children}</AuthCtx.Provider>;
}

export const useAppCtx = () => useContext(AuthCtx);
