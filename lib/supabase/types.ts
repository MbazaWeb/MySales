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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; full_name: string; phone?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id:           string;   // uuid
          owner_id:     string;   // auth.users.id
          name:         string;
          type:         string;
          timezone:     string;
          currency:     string;
          trial_ends_at: string;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?: string; owner_id: string; name: string; type: string;
          timezone?: string; currency?: string; trial_ends_at?: string;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      branches: {
        Row: {
          id:           string;
          business_id:  string;
          name:         string;
          location:     string;
          is_active:    boolean;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?: string; business_id: string; name: string; location: string;
          is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id:          string;
          branch_id:   string;
          name:        string;
          sku:         string | null;
          category:    string;
          stock:       number;
          unit:        string;
          price:       number;   // in TZS, smallest unit = 1
          reorder:     number;
          is_active:   boolean;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?: string; branch_id: string; name: string; sku?: string | null;
          category?: string; stock?: number; unit?: string; price: number;
          reorder?: number; is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      sales: {
        Row: {
          id:         string;
          branch_id:  string;
          product_id: string | null;
          product_name: string;  // denormalised for display
          qty:        number;
          unit_price: number;
          total:      number;
          payment:    string;
          status:     "Paid" | "Not paid";
          sold_by:    string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
        Relationships: [];
      };
      stock_logs: {
        Row: {
          id:         string;
          product_id: string;
          branch_id:  string;
          movement_type: "Opening" | "Purchase" | "Sale" | "Adjustment" | "Return";
          quantity_delta: number;
          balance_after: number;
          note:       string | null;
          reference_sale_id: string | null;
          added_by:   string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["stock_logs"]["Insert"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id:          string;
          business_id: string;
          user_id:     string;
          name:        string;
          role:        "Owner" | "Admin" | "Manager" | "Cashier" | "Stock keeper";
          branch_id:   string | null; // null = all branches
          is_active:   boolean;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?: string; business_id: string; user_id: string; name: string;
          role?: "Owner" | "Admin" | "Manager" | "Cashier" | "Stock keeper";
          branch_id?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          billing_interval: "Monthly" | "3 months" | "6 months" | "Yearly";
          status: "Trialing" | "Active" | "Past due" | "Canceled" | "Expired";
          amount_tzs: number;
          provider: string | null;
          provider_reference: string | null;
          starts_at: string;
          ends_at: string;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      alert_preferences: {
        Row: {
          business_id: string;
          low_stock_email: boolean;
          low_stock_sms: boolean;
          daily_report_email: boolean;
          daily_report_sms: boolean;
          recipient_email: string | null;
          recipient_phone: string | null;
          updated_at: string;
        };
        Insert: {
          business_id: string; low_stock_email?: boolean; low_stock_sms?: boolean;
          daily_report_email?: boolean; daily_report_sms?: boolean;
          recipient_email?: string | null; recipient_phone?: string | null; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alert_preferences"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      daily_revenue: {
        Row: {
          branch_id: string;
          day: string;
          paid_revenue: number;
          unpaid_revenue: number;
          gross_sales: number;
          transactions: number;
        };
        Relationships: [];
      };
      low_stock: {
        Row: Database["public"]["Tables"]["products"]["Row"];
        Relationships: [];
      };
    };
    Functions: {
      add_stock: {
        Args: { p_product_id: string; p_quantity: number; p_note?: string | null };
        Returns: number;
      };
      record_sale: {
        Args: {
          p_product_id: string;
          p_qty: number;
          p_payment: string;
          p_status?: "Paid" | "Not paid";
        };
        Returns: string;
      };
    };
    Enums: {
      sale_status: "Paid" | "Not paid";
      staff_role:  "Owner" | "Admin" | "Manager" | "Cashier" | "Stock keeper";
      subscription_interval: "Monthly" | "3 months" | "6 months" | "Yearly";
      subscription_status: "Trialing" | "Active" | "Past due" | "Canceled" | "Expired";
      stock_movement_type: "Opening" | "Purchase" | "Sale" | "Adjustment" | "Return";
    };
  };
}

// Convenience aliases
export type Business  = Database["public"]["Tables"]["businesses"]["Row"];
export type Profile   = Database["public"]["Tables"]["profiles"]["Row"];
export type Branch    = Database["public"]["Tables"]["branches"]["Row"];
export type Product   = Database["public"]["Tables"]["products"]["Row"];
export type Sale      = Database["public"]["Tables"]["sales"]["Row"];
export type StockLog  = Database["public"]["Tables"]["stock_logs"]["Row"];
export type Staff     = Database["public"]["Tables"]["staff"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type AlertPreference = Database["public"]["Tables"]["alert_preferences"]["Row"];
