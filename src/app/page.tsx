'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { QuizSettings } from '@/types';
import { Loader2, AlertCircle, History, Timer } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { setCurrentQuiz, setQuizSettings } = useQuiz();

  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    setLoading(true);
    setError('');
    const settings: QuizSettings = { topic, numberOfQuestions, difficulty, timerEnabled, timeLimitSeconds };
    setQuizSettings(settings);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate quiz');
      setCurrentQuiz({ topic, difficulty, questions: data.questions });
      router.push('/quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const suggested = ['World History', 'Python', 'Space', 'Biology', 'Mathematics', 'Geography'];

  const formatLimit = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec === 0 ? `${m} min` : `${m}m ${sec}s`;
  };

  return (
    <main className="min-h-screen bg-[#f9f9f9]">

      {/* Nav */}
      <nav className="bg-white border-b border-[#ebebeb] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[#0f0f0f] font-black text-base tracking-tight">QUIZLY</span>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 text-xs font-semibold text-[#aaa] hover:text-[#0f0f0f] transition-colors tracking-widest uppercase"
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </nav>

      {/* Hero — full width */}
      <div className="bg-[#0f0f0f] px-6 pt-10 pb-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-semibold tracking-[3px] uppercase mb-4">
            Quiz Generator
          </p>
          <h1 className="text-5xl font-black text-white leading-none tracking-tight uppercase">
            Test your<br />knowledge.
          </h1>
        </div>
      </div>

      {/* Card — wider */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-8 -mt-6 relative z-10 space-y-6">

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-[#aaa] mb-2 tracking-[2px] uppercase">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. World History, Python, Space..."
              className="w-full bg-[#f9f9f9] border border-[#e8e8e8] rounded-xl px-4 py-3 text-[#0f0f0f] placeholder-[#ccc] focus:outline-none focus:border-[#0f0f0f] focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {suggested.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-xs px-3 py-1 rounded-full border border-[#e8e8e8] text-[#aaa] hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-all font-medium"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-[#aaa] tracking-[2px] uppercase">
                Questions
              </label>
              <span className="text-sm font-black text-[#0f0f0f]">{numberOfQuestions}</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
              className="w-full accent-[#0f0f0f] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#ccc] mt-1">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-[#aaa] mb-3 tracking-[2px] uppercase">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${
                    difficulty === level
                      ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                      : 'bg-white border-[#e8e8e8] text-[#aaa] hover:border-[#0f0f0f] hover:text-[#0f0f0f]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-[#aaa]" />
                <label className="text-xs font-bold text-[#aaa] tracking-[2px] uppercase">
                  Timer
                </label>
              </div>
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  timerEnabled ? 'bg-[#0f0f0f]' : 'bg-[#e8e8e8]'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  timerEnabled ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {timerEnabled && (
              <div className="bg-[#f9f9f9] border border-[#e8e8e8] rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#aaa] font-medium">Time limit</span>
                  <span className="text-xs font-black text-[#0f0f0f]">{formatLimit(timeLimitSeconds)}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="600"
                  step="30"
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                  className="w-full accent-[#0f0f0f] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#ccc] mt-1">
                  <span>1 min</span>
                  <span>10 min</span>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl text-red-600 p-3 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#0f0f0f] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs tracking-[2px] uppercase"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            ) : (
              'Generate Quiz →'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-[#ccc] mt-4 font-medium">
          Progress is saved automatically to your browser
        </p>
      </div>
    </main>
  );
}