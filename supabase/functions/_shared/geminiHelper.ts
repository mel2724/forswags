interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export async function callGemini(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
    model?: string;
  } = {}
): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const model = options.model || 'gemini-2.0-flash-exp';
  const temperature = options.temperature ?? 0.7;
  const maxOutputTokens = options.maxOutputTokens ?? 2048;

  const geminiMessages: GeminiMessage[] = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const requestBody: GeminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key or unauthorized access.');
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response generated from Gemini');
  }

  const candidate = data.candidates[0];
  const content = candidate.content.parts[0].text;

  const usage = data.usageMetadata ? {
    promptTokens: data.usageMetadata.promptTokenCount,
    completionTokens: data.usageMetadata.candidatesTokenCount,
    totalTokens: data.usageMetadata.totalTokenCount,
  } : undefined;

  return { content, usage };
}

export function convertOpenAIMessagesToGemini(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  return messages.map(msg => {
    if (msg.role === 'system') {
      return { role: 'user', content: `System: ${msg.content}` };
    }
    if (msg.role === 'assistant') {
      return { role: 'model', content: msg.content };
    }
    return msg;
  });
}
