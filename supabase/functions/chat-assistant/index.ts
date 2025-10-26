import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  console.log('=== Chat assistant function called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing chat request...');
    
    // Parse and validate request body
    let message, conversationId, sessionId;
    try {
      const body = await req.json();
      
      // Validate message
      if (!body.message || typeof body.message !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Message is required and must be a string' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      message = body.message.trim();
      
      if (message.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Message cannot be empty' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (message.length > 2000) {
        return new Response(
          JSON.stringify({ error: 'Message is too long (maximum 2000 characters)' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate conversationId (optional UUID)
      if (body.conversationId && typeof body.conversationId === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(body.conversationId)) {
          return new Response(
            JSON.stringify({ error: 'Invalid conversation ID format' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        conversationId = body.conversationId;
      }
      
      // Validate sessionId (optional UUID)
      if (body.sessionId && typeof body.sessionId === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(body.sessionId)) {
          return new Response(
            JSON.stringify({ error: 'Invalid session ID format' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        sessionId = body.sessionId;
      }
      
      console.log('Validated body - Message length:', message.length, 'ConversationId:', conversationId, 'SessionId:', sessionId);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');

    // Get chatbot configuration
    console.log('Fetching chatbot config...');
    const { data: config, error: configError } = await supabase
      .from('chatbot_config')
      .select('*')
      .single();

    if (configError) {
      console.error('Config fetch error:', configError);
      throw new Error(`Failed to fetch config: ${configError.message}`);
    }
    
    if (!config) {
      throw new Error('Chatbot configuration not found');
    }
    
    console.log('Config loaded:', config.coach_name);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
    } else {
      // Create new conversation
      const { data } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: req.headers.get('x-user-id') || null,
          session_id: sessionId
        })
        .select()
        .single();
      conversation = data;
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Build messages array for AI
    const aiMessages = [
      { 
        role: 'system', 
        content: `${config.system_prompt}\n\nKnowledge Base:\n${config.knowledge_base}`
      },
      ...(history || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      });

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        max_completion_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'AI request failed: ' + errorText }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    const assistantMessage = aiData.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      console.error('No message in AI response:', aiData);
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save assistant message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage
      });

    // Update conversation last_message_at
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        conversationId: conversation.id,
        nickname: conversation.nickname
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
