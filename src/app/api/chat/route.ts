import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

// 1. FORÇA O MODO DINÂMICO (Crucial para Vercel/Next.js não cachear)
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('API /api/chat received body:', JSON.stringify(body, null, 2));

    const { messages, projectId } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('API Error: messages is missing or not an array', messages);
      return new Response(JSON.stringify({ error: 'messages is required and must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('API Processing messages:', messages);

    // Manual conversion to ensure stability
    const coreMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // 2. Chamada Simples e Direta
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: 'Você é um gerente de projetos experiente. Responda em Português do Brasil.',
      messages: coreMessages,
    });

    console.log('StreamText Result Keys:', Object.keys(result));

    // 3. Retorno do DataStream
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Erro API:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
