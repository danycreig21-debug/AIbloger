import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if comment bot is enabled
    const { data: config } = await supabaseClient
      .from('system_configs')
      .select('value')
      .eq('key', 'comment_bot_enabled')
      .single();

    if (config?.value !== 'true') {
      return new Response(
        JSON.stringify({ message: 'Comment bot is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
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

    // Get recent published blogs that don't have many comments
    const { data: blogs } = await supabaseClient
      .from('blogs')
      .select(`
        id,
        title,
        content,
        comments:comments(count)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);

    if (!blogs || blogs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No blogs available for commenting' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Select a blog with fewer comments
    const blogForComment = blogs.find(blog => blog.comments.length < 3) || blogs[0];

    // Generate realistic comment using OpenAI
    const fakeNames = [
      'Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Wilson', 'David Kim',
      'Lisa Brown', 'Ryan Taylor', 'Maya Patel', 'James Davis', 'Anna Garcia',
      'Chris Lee', 'Jessica Wang', 'Kevin Murphy', 'Rachel Green', 'Tom Anderson'
    ];

    const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];

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
            content: 'You are generating realistic, engaging comments for blog posts. Create comments that sound natural and add value to the discussion.'
          },
          {
            role: 'user',
            content: `Generate a thoughtful comment for this blog post titled "${blogForComment.title}". 
            The comment should be:
            - 1-3 sentences long
            - Constructive and relevant
            - Sound like a real person wrote it
            - Add value to the discussion
            - Be positive but authentic
            
            Just return the comment text, nothing else.`
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const commentContent = openAIData.choices[0].message.content.trim();

    // Insert the comment
    const { data: insertedComment, error: insertError } = await supabaseClient
      .from('comments')
      .insert({
        blog_id: blogForComment.id,
        author_name: randomName,
        content: commentContent,
        is_bot_generated: true,
        status: 'approved'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        comment: insertedComment,
        message: 'Comment generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating comment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});