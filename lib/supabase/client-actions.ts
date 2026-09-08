/**
 * Client-safe re-export of server actions.
 * Import server actions in Client Components from HERE.
 * Server page.tsx files import directly from actions.ts.
 */
"use server";

export {
  sendOtp,
  verifyOtp,
  signOut,
  createProduct,
  addStockEntry,
  recordSale,
  addBranch,
  addBranchWithStaff,
  createCheckoutSession,
  handleWebhook,
  getReportSales,
  editProduct,
  deleteProduct,
  getStockLogs,
} from "./actions";
