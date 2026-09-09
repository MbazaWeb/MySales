export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: { id: string; owner_id: string; name: string; type: string; timezone: string; currency: string; trial_ends_at: string; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["businesses"]["Row"], "id" | "created_at" | "updated_at" | "trial_ends_at">;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      branches: {
        Row: { id: string; business_id: string; name: string; location: string; is_active: boolean; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at" | "updated_at" | "is_active">;
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id:           string;
          branch_id:    string;
          name:         string;
          sku:          string | null;
          category:     string;
          stock:        number;
          unit:         string;
          size:         string;   // "kipimo" size spec: '' | small | mid | large
          cost_price:   number;    // buying / retail price (TZS)
          selling_price: number;   // price charged to customer (TZS)
          price:        number;    // alias = selling_price for backward compat
          reorder:      number;
          is_active:    boolean;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?: string; branch_id: string; name: string; sku?: string | null;
          category?: string; stock?: number; unit?: string; size?: string;
          cost_price: number; selling_price: number; price?: number;
          reorder?: number; is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      sales: {
        Row: {
          id:             string;
          branch_id:      string;
          product_id:     string | null;
          product_name:   string;
          qty:            number;
          unit_price:     number;
          cost_price:     number;   // captured at time of sale for profit calc
          total:          number;
          profit:         number;   // (unit_price - cost_price) * qty
          payment:        string;
          status:         "Paid" | "Not paid" | "Returned";
          customer_name:  string | null;
          customer_phone: string | null;
          sold_by:        string | null;
          created_at:     string;
        };
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
        Relationships: [];
      };
      stock_logs: {
        Row: { id: string; product_id: string; branch_id: string; movement_type: string; quantity_delta: number; balance_after: number; note: string | null; reference_sale_id: string | null; added_by: string | null; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["stock_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["stock_logs"]["Insert"]>;
        Relationships: [];
      };
      staff: {
        Row: { id: string; business_id: string; user_id: string; name: string; role: string; branch_id: string | null; is_active: boolean; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["staff"]["Row"], "id" | "created_at" | "updated_at" | "is_active">;
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; full_name: string; phone: string | null; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: { id: string; business_id: string; billing_interval: string; status: string; amount_tzs: number; starts_at: string; ends_at: string; created_at: string; updated_at: string; };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      alert_preferences: {
        Row: { business_id: string; low_stock_email: boolean; low_stock_sms: boolean; daily_report_email: boolean; daily_report_sms: boolean; recipient_email: string | null; recipient_phone: string | null; updated_at: string; };
        Insert: Partial<Database["public"]["Tables"]["alert_preferences"]["Row"]> & { business_id: string };
        Update: Partial<Database["public"]["Tables"]["alert_preferences"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      record_sale: { Args: { p_product_id: string; p_qty: number; p_payment: string; p_status: string; p_customer_name?: string | null; p_customer_phone?: string | null; }; Returns: string; };
      add_stock: { Args: { p_product_id: string; p_quantity: number; p_note?: string | null }; Returns: number; };
      mark_sale_paid: { Args: { p_sale_id: string }; Returns: undefined; };
      return_sale: { Args: { p_sale_id: string }; Returns: undefined; };
    };
    Enums: {};
  };
}

export type Business  = Database["public"]["Tables"]["businesses"]["Row"];
export type Branch    = Database["public"]["Tables"]["branches"]["Row"];
export type Product   = Database["public"]["Tables"]["products"]["Row"];
export type Sale      = Database["public"]["Tables"]["sales"]["Row"];
export type StockLog  = Database["public"]["Tables"]["stock_logs"]["Row"];
export type Staff     = Database["public"]["Tables"]["staff"]["Row"];
