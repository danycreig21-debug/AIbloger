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
    const { blogId } = await req.json();

    if (!blogId) {
      throw new Error('Blog ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the blog post
    const { data: blog, error: fetchError } = await supabaseClient
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (fetchError || !blog) {
      throw new Error('Blog post not found');
    }

    if (blog.summary) {
      return new Response(
        JSON.stringify({ message: 'Blog already has a summary' }),
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

    // Generate summary using OpenAI
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
            content: 'You are a professional editor who creates concise, engaging summaries of blog posts.'
          },
          {
            role: 'user',
            content: `Please create a concise summary of this blog post. The summary should be 2-3 sentences long and capture the main points and key insights.

Title: ${blog.title}

Content: ${blog.content}

Create a summary that would help readers quickly understand what the blog post is about and its main value.`
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content.trim();

    // Update the blog with the summary
    const { error: updateError } = await supabaseClient
      .from('blogs')
      .update({ summary })
      .eq('id', blogId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary,
        message: 'Summary generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});