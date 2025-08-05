import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Heart, MessageCircle, Sparkles, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogCardProps {
  blog: {
    id: string;
    title: string;
    content: string;
    summary?: string | null;
    slug: string;
    category: string;
    tags: string[];
    view_count: number;
    like_count: number;
    created_at: string;
    published_at: string | null;
    author_id: string;
  };
  onSummarize?: (blogId: string) => Promise<void>;
  isGeneratingSummary?: boolean;
}

export default function BlogCard({ blog, onSummarize, isGeneratingSummary }: BlogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const excerpt = blog.content.length > 200 ? 
    blog.content.substring(0, 200) + '...' : 
    blog.content;

  const publishedDate = blog.published_at || blog.created_at;

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="p-6">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {blog.category}
          </span>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDistanceToNow(new Date(publishedDate), { addSuffix: true })}
          </div>
        </div>

        {/* Title */}
        <Link to={`/blog/${blog.slug}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-indigo-600 transition-colors cursor-pointer">
            {blog.title}
          </h3>
        </Link>

        {/* Summary or Content Preview */}
        <div className="mb-4">
          {blog.summary ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
              <div className="flex items-center mb-2">
                <Sparkles className="h-4 w-4 text-emerald-600 mr-1" />
                <span className="text-sm font-medium text-emerald-800">AI Summary</span>
              </div>
              <p className="text-sm text-emerald-700">{blog.summary}</p>
            </div>
          ) : null}
          
          <p className="text-gray-700 leading-relaxed">
            {isExpanded ? blog.content : excerpt}
          </p>
          
          {blog.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
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
              Comments
            </div>
          </div>

          {/* Summarize Button */}
          {!blog.summary && onSummarize && (
            <button
              onClick={() => onSummarize(blog.id)}
              disabled={isGeneratingSummary}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingSummary ? (
                <>
                  <Clock className="animate-spin h-4 w-4 mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Summarize
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}