export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TransactionType = 'income' | 'expense';

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: TransactionType;
          icon: string;
          color: string;
          monthly_limit: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: TransactionType;
          icon?: string;
          color?: string;
          monthly_limit?: number | string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: TransactionType;
          icon?: string;
          color?: string;
          monthly_limit?: number | string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          currency: string;
          total_amount: string;
          annual_interest_rate: string | null;
          payment_end_year: number | null;
          remaining_schedule_months: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          currency?: string;
          total_amount: number | string;
          annual_interest_rate?: number | string | null;
          payment_end_year?: number | null;
          remaining_schedule_months?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          currency?: string;
          total_amount?: number | string;
          annual_interest_rate?: number | string | null;
          payment_end_year?: number | null;
          remaining_schedule_months?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          loan_id: string | null;
          amount: string;
          type: TransactionType;
          occurred_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          loan_id?: string | null;
          amount: number | string;
          type: TransactionType;
          occurred_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          loan_id?: string | null;
          amount?: number | string;
          type?: TransactionType;
          occurred_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          currency: string;
          target_amount: string;
          saved_amount: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          currency?: string;
          target_amount: number | string;
          saved_amount?: number | string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          currency?: string;
          target_amount?: number | string;
          saved_amount?: number | string;
          created_at?: string;
        };
        Relationships: [];
      };
      transfers: {
        Row: {
          id: string;
          user_id: string;
          from_account_id: string;
          to_account_id: string;
          amount: string;
          occurred_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_account_id: string;
          to_account_id: string;
          amount: number | string;
          occurred_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_account_id?: string;
          to_account_id?: string;
          amount?: number | string;
          occurred_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
