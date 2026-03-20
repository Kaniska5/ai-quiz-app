import { NextRequest, NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { question, options } = await request.json();

    if (!question || !options) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful quiz assistant. Give a short hint (1-2 sentences max) that helps narrow down the answer without directly revealing it.',
              },
              {
                role: 'user',
                content: `Question: ${question}\nOptions: ${options.join(', ')}\n\nGive a subtle hint.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 100,
          }),
        });

        // Rate limit — wait and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY_MS * attempt;
          await sleep(waitMs);
          throw new Error('RATE_LIMIT');
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const hint = data.choices?.[0]?.message?.content;

        if (!hint) throw new Error('Empty response from AI');

        return NextResponse.json({ hint });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');

        const isRetryable =
          lastError.message === 'RATE_LIMIT' ||
          lastError.message.includes('503') ||
          lastError.message.includes('502') ||
          lastError.message.includes('500') ||
          lastError.message.includes('Empty response');

        if (!isRetryable || attempt === MAX_RETRIES) break;

        // Exponential backoff: 1s, 2s, 4s
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }

    return NextResponse.json(
      { error: lastError?.message || 'Could not generate hint after multiple attempts' },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}