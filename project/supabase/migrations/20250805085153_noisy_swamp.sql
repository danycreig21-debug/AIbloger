/*
  # AI-Powered Blog System Database Schema

  1. New Tables
    - `blogs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `summary` (text, nullable)
      - `slug` (text, unique)
      - `category` (text)
      - `tags` (text array)
      - `status` (text: draft, published, archived)
      - `author_id` (uuid, references auth.users)
      - `view_count` (integer, default 0)
      - `like_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp, nullable)

    - `comments`
      - `id` (uuid, primary key)
      - `blog_id` (uuid, references blogs)
      - `author_name` (text)
      - `author_email` (text, nullable)
      - `content` (text)
      - `is_bot_generated` (boolean, default false)
      - `status` (text: pending, approved, rejected)
      - `created_at` (timestamp)

    - `social_media_posts`
      - `id` (uuid, primary key)
      - `blog_id` (uuid, references blogs)
      - `platform` (text: twitter, linkedin, facebook, instagram)
      - `content` (text)
      - `status` (text: draft, scheduled, published, failed)
      - `scheduled_at` (timestamp, nullable)
      - `published_at` (timestamp, nullable)
      - `engagement_metrics` (jsonb, nullable)
      - `created_at` (timestamp)

    - `system_configs`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text)
      - `description` (text, nullable)
      - `updated_at` (timestamp)

    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `role` (text: admin, editor, author, default 'author')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admins
    - Public read access for published content
    - Admin-only access for system configs

  3. Indexes
    - Blog slug for SEO-friendly URLs
    - Blog status and published_at for filtering
    - Comment blog_id for efficient lookups
    - Social media platform and status for automation
*/

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  slug text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  is_bot_generated boolean DEFAULT false,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Create social_media_posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  engagement_metrics jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create system_configs table
CREATE TABLE IF NOT EXISTS system_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'author' CHECK (role IN ('admin', 'editor', 'author')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Blogs policies
CREATE POLICY "Anyone can view published blogs" ON blogs
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their own blogs" ON blogs
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all blogs" ON blogs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments policies
CREATE POLICY "Anyone can view approved comments" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all comments" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Social media posts policies
CREATE POLICY "Authors can view their social media posts" ON social_media_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blogs 
      WHERE blogs.id = social_media_posts.blog_id 
      AND blogs.author_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all social media posts" ON social_media_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System configs policies
CREATE POLICY "Only admins can manage system configs" ON system_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status_published ON blogs(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_blog_platform ON social_media_posts(blog_id, platform);
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);

-- Insert default system configurations
INSERT INTO system_configs (key, value, description) VALUES
  ('blog_generation_interval', '300', 'Blog generation interval in seconds (default: 5 minutes)'),
  ('comment_bot_interval', '180', 'Comment bot interval in seconds (default: 3 minutes)'),
  ('openai_api_key', '', 'OpenAI API key for LLM integration'),
  ('blog_generation_enabled', 'true', 'Enable/disable automated blog generation'),
  ('comment_bot_enabled', 'true', 'Enable/disable automated comment generation'),
  ('social_media_automation_enabled', 'true', 'Enable/disable social media automation')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();