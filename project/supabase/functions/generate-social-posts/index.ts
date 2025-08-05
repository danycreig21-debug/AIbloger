import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialPost {
  platform: string;
  content: string;
  maxLength: number;
  style: string;
}

const platforms: SocialPost[] = [
  {
    platform: 'twitter',
    content: '',
    maxLength: 280,
    style: 'concise, engaging, with relevant hashtags'
  },
  {
    platform: 'linkedin',
    content: '',
    maxLength: 3000,
    style: 'professional, insightful, thought-leadership focused'
  },
  {
    platform: 'facebook',
    content: '',
    maxLength: 2000,
    style: 'conversational, engaging, community-focused'
  },
  {
    platform: 'instagram',
    content: '',
    maxLength: 2200,
    style: 'visual-focused caption, inspirational, with strategic hashtags'
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { blogId } = await req.json();

    if (!blogId) {
      throw new Error('Blog ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if social media automation is enabled
    const { data: config } = await supabaseClient
      .from('system_configs')
      .select('value')
      .eq('key', 'social_media_automation_enabled')
      .single();

    if (config?.value !== 'true') {
      return new Response(
        JSON.stringify({ message: 'Social media automation is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get the blog post
    const { data: blog, error: fetchError } = await supabaseClient
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (fetchError || !blog) {
      throw new Error('Blog post not found');
    }

    // Get OpenAI API key
    const { data: apiKeyConfig } = await supabaseClient
      .from('system_configs')
      .select('value')
      .eq('key', 'openai_api_key')
      .single();

    if (!apiKeyConfig?.value) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate social media posts for each platform
    const generatedPosts = [];

    for (const platform of platforms) {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeyConfig.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert who creates platform-specific content that drives engagement and reaches the right audience.`
            },
            {
              role: 'user',
              content: `Create a ${platform.platform} post for this blog article. 

Blog Title: ${blog.title}
Blog Content: ${blog.content}
Blog Category: ${blog.category}
Blog Tags: ${blog.tags.join(', ')}

Requirements for ${platform.platform}:
- Style: ${platform.style}
- Maximum length: ${platform.maxLength} characters
- Include a call-to-action to read the full blog
- Make it engaging and shareable
- Include relevant hashtags (2-5 for Twitter, 3-7 for Instagram, 1-3 for LinkedIn/Facebook)

Return only the post content, no additional text or formatting.`
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!openAIResponse.ok) {
        console.error(`OpenAI API error for ${platform.platform}: ${openAIResponse.statusText}`);
        continue;
      }

      const openAIData = await openAIResponse.json();
      const postContent = openAIData.choices[0].message.content.trim();

      // Insert the social media post
      const { data: insertedPost, error: insertError } = await supabaseClient
        .from('social_media_posts')
        .insert({
          blog_id: blogId,
          platform: platform.platform,
          content: postContent,
          status: 'draft'
        })
        .select()
        .single();

      if (!insertError && insertedPost) {
        generatedPosts.push(insertedPost);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        posts: generatedPosts,
        message: `Generated ${generatedPosts.length} social media posts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating social posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});