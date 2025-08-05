import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if blog generation is enabled
    const { data: config } = await supabaseClient
      .from('system_configs')
      .select('value')
      .eq('key', 'blog_generation_enabled')
      .single();

    if (config?.value !== 'true') {
      return new Response(
        JSON.stringify({ message: 'Blog generation is disabled' }),
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

    // Generate blog post using OpenAI
    const topics = [
      'Artificial Intelligence and Machine Learning',
      'Web Development Best Practices',
      'Future of Technology',
      'Digital Marketing Strategies',
      'Cybersecurity Essentials',
      'Cloud Computing Trends',
      'Mobile App Development',
      'Data Science and Analytics',
      'User Experience Design',
      'Blockchain Technology'
    ];

    const categories = [
      'Technology', 'Business', 'Science', 'Health', 'Education',
      'Innovation', 'Trends', 'Tutorial', 'Opinion', 'News'
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

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
            content: 'You are a professional blog writer. Create engaging, informative blog posts with clear structure and valuable insights.'
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post about "${randomTopic}" in the "${randomCategory}" category. 
            The post should be:
            - 400-600 words long
            - Well-structured with clear sections
            - Informative and engaging
            - Professional but accessible
            - Include practical insights or tips
            
            Format the response as JSON with:
            - title: A compelling title
            - content: The full blog post content (plain text, no markdown)
            - tags: Array of 3-5 relevant tags`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedContent = JSON.parse(openAIData.choices[0].message.content);

    const blogPost: BlogPost = {
      title: generatedContent.title,
      content: generatedContent.content,
      category: randomCategory,
      tags: generatedContent.tags || []
    };

    // Create slug from title
    const slug = blogPost.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Get or create system user
    let authorId = 'system';
    const { data: systemUser } = await supabaseClient.auth.admin.createUser({
      email: 'system@aiblog.com',
      password: 'system-generated',
      email_confirm: true
    });

    if (systemUser.user) {
      authorId = systemUser.user.id;
    }

    // Save blog post to database
    const { data: insertedBlog, error: insertError } = await supabaseClient
      .from('blogs')
      .insert({
        title: blogPost.title,
        content: blogPost.content,
        slug: slug + '-' + Date.now(), // Ensure uniqueness
        category: blogPost.category,
        tags: blogPost.tags,
        status: 'published',
        author_id: authorId,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        blog: insertedBlog,
        message: 'Blog post generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating blog:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});