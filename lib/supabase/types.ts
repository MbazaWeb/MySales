/**
 * DukaVerse Database type definitions.
 *
 * These mirror the Supabase tables below.
 * Run `supabase gen types typescript --linked` to regenerate from your
 * actual schema once you've applied the migration.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id:           string;   // uuid
          owner_id:     string;   // auth.users.id
          name:         string;
          type:         string;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["businesses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      branches: {
        Row: {
          id:           string;
          business_id:  string;
          name:         string;
          location:     string;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      products: {
        Row: {
          id:          string;
          branch_id:   string;
          name:        string;
          category:    string;
          stock:       number;
          unit:        string;
          price:       number;   // in TZS, smallest unit = 1
          reorder:     number;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      sales: {
        Row: {
          id:         string;
          branch_id:  string;
          product_id: string;
          product_name: string;  // denormalised for display
          qty:        number;
          total:      number;
          payment:    string;
          status:     "Paid" | "Not paid";
          sold_by:    string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
      };
      stock_logs: {
        Row: {
          id:         string;
          product_id: string;
          branch_id:  string;
          qty_added:  number;
          note:       string | null;
          added_by:   string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["stock_logs"]["Insert"]>;
      };
      staff: {
        Row: {
          id:          string;
          business_id: string;
          user_id:     string;
          name:        string;
          role:        "Owner" | "Admin" | "Manager" | "Cashier" | "Stock keeper";
          branch_id:   string | null; // null = all branches
          created_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["staff"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      sale_status: "Paid" | "Not paid";
      staff_role:  "Owner" | "Admin" | "Manager" | "Cashier" | "Stock keeper";
    };
  };
}

// Convenience aliases
export type Business  = Database["public"]["Tables"]["businesses"]["Row"];
export type Branch    = Database["public"]["Tables"]["branches"]["Row"];
export type Product   = Database["public"]["Tables"]["products"]["Row"];
export type Sale      = Database["public"]["Tables"]["sales"]["Row"];
export type StockLog  = Database["public"]["Tables"]["stock_logs"]["Row"];
export type Staff     = Database["public"]["Tables"]["staff"]["Row"];
