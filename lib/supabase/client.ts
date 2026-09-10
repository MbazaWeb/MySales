import "react-native-url-polyfill/auto";
import { createClient }   from "@supabase/supabase-js";
import * as SecureStore   from "expo-secure-store";
import type { Database }  from "./types";

const ExpoSecureStoreAdapter = {
  getItem:    (key: string)              => SecureStore.getItemAsync(key),
  setItem:    (key: string, val: string) => SecureStore.setItemAsync(key, val),
  removeItem: (key: string)              => SecureStore.deleteItemAsync(key),
};

const url     = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage:             ExpoSecureStoreAdapter,
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  false,
  },
});
