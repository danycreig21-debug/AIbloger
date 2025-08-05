import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StatusIndicator from '../components/StatusIndicator';
import { Settings, Play, Pause, RefreshCw, Database, Bot, Share2, MessageSquare } from 'lucide-react';

interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
}

interface SystemStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalComments: number;
  botComments: number;
  socialPosts: number;
  todayActivity: number;
}

export default function AdminPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalComments: 0,
    botComments: 0,
    socialPosts: 0,
    todayActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('*')
        .order('key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Total blogs
      const { count: totalBlogs } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true });

      // Published blogs
      const { count: publishedBlogs } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Draft blogs
      const { count: draftBlogs } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // Total comments
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      // Bot comments
      const { count: botComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_bot_generated', true);

      // Social posts
      const { count: socialPosts } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true });

      // Today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayActivity } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalBlogs: totalBlogs || 0,
        publishedBlogs: publishedBlogs || 0,
        draftBlogs: draftBlogs || 0,
        totalComments: totalComments || 0,
        botComments: botComments || 0,
        socialPosts: socialPosts || 0,
        todayActivity: todayActivity || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_configs')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
      
      // Update local state
      setConfigs(configs.map(config => 
        config.key === key ? { ...config, value } : config
      ));
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerBlogGeneration = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error triggering blog generation:', error);
    }
  };

  const triggerCommentGeneration = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error triggering comment generation:', error);
    }
  };

  const getConfigValue = (key: string) => {
    return configs.find(config => config.key === key)?.value || '';
  };

  const isEnabled = (key: string) => {
    return getConfigValue(key) === 'true';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="text-lg font-medium text-gray-700">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Monitor and manage your AI-powered blog system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <Database className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBlogs}</p>
                <p className="text-sm text-gray-600">Total Blogs</p>
                <p className="text-xs text-gray-500">
                  {stats.publishedBlogs} published, {stats.draftBlogs} drafts
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100">
                <MessageSquare className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.totalComments}</p>
                <p className="text-sm text-gray-600">Total Comments</p>
                <p className="text-xs text-gray-500">
                  {stats.botComments} bot generated
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Share2 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.socialPosts}</p>
                <p className="text-sm text-gray-600">Social Posts</p>
                <p className="text-xs text-gray-500">All platforms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.todayActivity}</p>
                <p className="text-sm text-gray-600">Today's Activity</p>
                <p className="text-xs text-gray-500">New content</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusIndicator
              status={isEnabled('blog_generation_enabled') ? 'active' : 'inactive'}
              label="Automated Blog Generation"
              lastUpdate="2 minutes ago"
            />
            <StatusIndicator
              status={isEnabled('comment_bot_enabled') ? 'active' : 'inactive'}
              label="Comment Bot"
              lastUpdate="1 minute ago"
            />
            <StatusIndicator
              status={isEnabled('social_media_automation_enabled') ? 'active' : 'inactive'}
              label="Social Media Automation"
              lastUpdate="5 minutes ago"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Controls */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Blog Generation</h4>
                  <p className="text-sm text-gray-600">
                    Interval: {getConfigValue('blog_generation_interval')}s
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateConfig('blog_generation_enabled', 
                      isEnabled('blog_generation_enabled') ? 'false' : 'true'
                    )}
                    disabled={isSaving}
                    className={`p-2 rounded-md transition-colors ${
                      isEnabled('blog_generation_enabled')
                        ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {isEnabled('blog_generation_enabled') ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={triggerBlogGeneration}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-md transition-colors"
                  >
                    Generate Now
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Comment Bot</h4>
                  <p className="text-sm text-gray-600">
                    Interval: {getConfigValue('comment_bot_interval')}s
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateConfig('comment_bot_enabled', 
                      isEnabled('comment_bot_enabled') ? 'false' : 'true'
                    )}
                    disabled={isSaving}
                    className={`p-2 rounded-md transition-colors ${
                      isEnabled('comment_bot_enabled')
                        ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {isEnabled('comment_bot_enabled') ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={triggerCommentGeneration}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-md transition-colors"
                  >
                    Generate Now
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Social Media Automation</h4>
                  <p className="text-sm text-gray-600">Multi-platform posting</p>
                </div>
                <button
                  onClick={() => updateConfig('social_media_automation_enabled', 
                    isEnabled('social_media_automation_enabled') ? 'false' : 'true'
                  )}
                  disabled={isSaving}
                  className={`p-2 rounded-md transition-colors ${
                    isEnabled('social_media_automation_enabled')
                      ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {isEnabled('social_media_automation_enabled') ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={getConfigValue('openai_api_key')}
                  onChange={(e) => updateConfig('openai_api_key', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Generation Interval (seconds)
                </label>
                <input
                  type="number"
                  value={getConfigValue('blog_generation_interval')}
                  onChange={(e) => updateConfig('blog_generation_interval', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment Bot Interval (seconds)
                </label>
                <input
                  type="number"
                  value={getConfigValue('comment_bot_interval')}
                  onChange={(e) => updateConfig('comment_bot_interval', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}