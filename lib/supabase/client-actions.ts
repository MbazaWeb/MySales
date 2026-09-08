"use client";

// Re-export server actions for client components
export { 
  sendOtp,
  verifyOtp,
  signUp,
  signIn,
  signOut,
  getActiveBranch,
  getProducts,
  createProduct,
  editProduct,
  deleteProduct,
  addStockEntry,
  getSales,
  recordSale,
  getReportSales,
  getStockLogs,
  getBusinessData,
  addBranch,
  inviteStaff,
  getBusinessDataWithStaff
} from "./server-actions";
