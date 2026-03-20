import { NextRequest, NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGroq(prompt: string, apiKey: string, attempt: number): Promise<string> {
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
          content: 'You are a quiz generator. Always respond with valid JSON only, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
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
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error('Empty response from AI');

  return text;
}

function parseQuestions(text: string) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const questions = JSON.parse(cleaned);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid questions format');
  }
  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const { topic, numberOfQuestions, difficulty, questionType } = await request.json();

    if (!topic || !numberOfQuestions || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    let typeInstruction = '';
    if (questionType === 'truefalse') {
      typeInstruction = 'Generate ONLY True/False questions. Each question must have exactly 2 options: ["True", "False"]. The correctAnswer must be either "True" or "False".';
    } else if (questionType === 'mixed') {
      typeInstruction = 'Generate a mix of multiple choice questions (4 options) and True/False questions (2 options: ["True", "False"]). For True/False questions set type to "truefalse", for multiple choice set type to "multiple".';
    } else {
      typeInstruction = 'Generate ONLY multiple choice questions with exactly 4 options each. Set type to "multiple" for each question.';
    }

    const prompt = `Generate ${numberOfQuestions} quiz questions about "${topic}" at ${difficulty} difficulty level.

${typeInstruction}

Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.

Each question must follow this exact format:
[
  {
    "id": 1,
    "type": "multiple",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- correctAnswer must be exactly one of the options
- Make questions appropriate for ${difficulty} difficulty
- Return exactly ${numberOfQuestions} questions total`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const text = await callGroq(prompt, apiKey, attempt);
        const questions = parseQuestions(text);
        return NextResponse.json({ questions });
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
      { error: lastError?.message || 'Failed to generate questions after multiple attempts' },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}