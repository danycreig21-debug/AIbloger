import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string;
          title: string;
          content: string;
          summary: string | null;
          slug: string;
          category: string;
          tags: string[];
          status: 'draft' | 'published' | 'archived';
          author_id: string;
          view_count: number;
          like_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          summary?: string | null;
          slug: string;
          category?: string;
          tags?: string[];
          status?: 'draft' | 'published' | 'archived';
          author_id: string;
          view_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          summary?: string | null;
          slug?: string;
          category?: string;
          tags?: string[];
          status?: 'draft' | 'published' | 'archived';
          author_id?: string;
          view_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          blog_id: string;
          author_name: string;
          author_email: string | null;
          content: string;
          is_bot_generated: boolean;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          blog_id: string;
          author_name: string;
          author_email?: string | null;
          content: string;
          is_bot_generated?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          blog_id?: string;
          author_name?: string;
          author_email?: string | null;
          content?: string;
          is_bot_generated?: boolean;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
      };
      social_media_posts: {
        Row: {
          id: string;
          blog_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
          content: string;
          status: 'draft' | 'scheduled' | 'published' | 'failed';
          scheduled_at: string | null;
          published_at: string | null;
          engagement_metrics: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          blog_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
          content: string;
          status?: 'draft' | 'scheduled' | 'published' | 'failed';
          scheduled_at?: string | null;
          published_at?: string | null;
          engagement_metrics?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          blog_id?: string;
          platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
          content?: string;
          status?: 'draft' | 'scheduled' | 'published' | 'failed';
          scheduled_at?: string | null;
          published_at?: string | null;
          engagement_metrics?: any;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          role: 'admin' | 'editor' | 'author';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'admin' | 'editor' | 'author';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: 'admin' | 'editor' | 'author';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};