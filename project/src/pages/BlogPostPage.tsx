import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Eye, Heart, MessageCircle, Sparkles, Share2, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Blog {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  tags: string[];
  view_count: number;
  like_count: number;
  created_at: string;
  published_at: string | null;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  is_bot_generated: boolean;
  created_at: string;
}

interface SocialPost {
  platform: string;
  content: string;
  status: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [newComment, setNewComment] = useState({ name: '', content: '' });

  useEffect(() => {
    if (slug) {
      fetchBlog();
      fetchComments();
      fetchSocialPosts();
    }
  }, [slug]);

  const fetchBlog = async () => {
    if (!slug) return;

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setBlog(data);

      // Increment view count
      await supabase
        .from('blogs')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!slug) return;

    try {
      const { data: blogData } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', slug)
        .single();

      if (blogData) {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('blog_id', blogData.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchSocialPosts = async () => {
    if (!blog) return;

    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('platform, content, status')
        .eq('blog_id', blog.id);

      if (error) throw error;
      setSocialPosts(data || []);
    } catch (error) {
      console.error('Error fetching social posts:', error);
    }
  };

  const generateSocialPosts = async () => {
    if (!blog) return;

    setIsGeneratingSocial(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-social-posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blogId: blog.id }),
      });

      if (response.ok) {
        fetchSocialPosts();
      }
    } catch (error) {
      console.error('Error generating social posts:', error);
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog || !newComment.name.trim() || !newComment.content.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          blog_id: blog.id,
          author_name: newComment.name.trim(),
          content: newComment.content.trim(),
          is_bot_generated: false,
          status: 'approved'
        });

      if (error) throw error;
      
      setNewComment({ name: '', content: '' });
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      default: return Share2;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Blog post not found</h1>
          <p className="text-gray-600">The blog post you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Blog Post */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {blog.category}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(blog.published_at || blog.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {blog.view_count}
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {blog.like_count}
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {comments.length}
                </div>
              </div>
            </div>

            {/* Summary */}
            {blog.summary && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 mr-2" />
                  <span className="font-medium text-emerald-800">AI Summary</span>
                </div>
                <p className="text-emerald-700">{blog.summary}</p>
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none mb-6">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {blog.content}
              </div>
            </div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Social Media Posts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Social Media Posts</h2>
              <button
                onClick={generateSocialPosts}
                disabled={isGeneratingSocial}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingSocial ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Generate Posts
                  </>
                )}
              </button>
            </div>

            {socialPosts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No social media posts generated yet. Click "Generate Posts" to create platform-specific content.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialPosts.map((post, index) => {
                  const Icon = getPlatformIcon(post.platform);
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Icon className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="font-medium text-gray-900 capitalize">{post.platform}</span>
                        <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                          post.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                          post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{post.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Comments ({comments.length})
            </h2>

            {/* Add Comment Form */}
            <form onSubmit={submitComment} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newComment.name}
                  onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <textarea
                placeholder="Write your comment..."
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Post Comment
              </button>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{comment.author_name}</span>
                        {comment.is_bot_generated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Bot className="h-3 w-3 mr-1" />
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}