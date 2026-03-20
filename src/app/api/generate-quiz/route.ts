import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, numberOfQuestions, difficulty } = await request.json();

    if (!topic || !numberOfQuestions || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

const apiKey = process.env.GROQ_API_KEY;
    const prompt = `Generate ${numberOfQuestions} multiple choice quiz questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array with no extra text, no markdown, no code blocks. Just the raw JSON array.

Each question must follow this exact format:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- correctAnswer must be exactly one of the 4 options
- Make questions appropriate for ${difficulty} difficulty
- Each question must have exactly 4 options
- Return ${numberOfQuestions} questions total`;

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
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', JSON.stringify(error));
      return NextResponse.json(
        { error: error?.error?.message || 'Failed to generate questions' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid questions format' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}