/**
 * Client-safe re-export of server actions.
 *
 * Next.js 15 requires that "use server" functions be imported via a
 * module that is itself allowed to cross the server→client boundary.
 * Import server actions in client components from HERE, not from actions.ts.
 *
 * Server components (page.tsx files) can import directly from actions.ts.
 */
"use server";

export {
  // Auth
  sendOtp,
  verifyOtp,
  signOut,
  // Products
  createProduct,
  addStockEntry,
  // Sales
  recordSale,
  // Profile
  addBranch,
  addBranchWithStaff,
  // Subscriptions
  createCheckoutSession,
  handleWebhook,
} from "./actions";
