'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { QuizSettings } from '@/types';
import { Loader2, AlertCircle, History, Timer, Zap } from 'lucide-react';

const CATEGORIES = [
  { name: 'General Knowledge', topics: ['Random Facts', 'Trivia', 'Mixed Topics'] },
  { name: 'Science', topics: ['Biology', 'Chemistry', 'Physics', 'Space', 'Environment'] },
  { name: 'History', topics: ['World History', 'Ancient History', 'Modern History', 'Wars'] },
  { name: 'Technology', topics: ['Python', 'JavaScript', 'AI & ML', 'Cybersecurity', 'Web Dev'] },
  { name: 'Mathematics', topics: ['Algebra', 'Geometry', 'Statistics', 'Calculus'] },
  { name: 'Language', topics: ['English Grammar', 'Vocabulary', 'Literature'] },
  { name: 'Geography', topics: ['World Geography', 'Capitals', 'Oceans & Continents'] },
  { name: 'Sports', topics: ['Football', 'Cricket', 'Olympics', 'Basketball'] },
];

// ── Main Home Page ───────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { setCurrentQuiz, setQuizSettings } = useQuiz();

  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [topic, setTopic] = useState(CATEGORIES[0].topics[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionType, setQuestionType] = useState<'multiple' | 'truefalse' | 'mixed'>('multiple');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCustomCategory = useCustomCategory;
  const selectedCategory = CATEGORIES.find(c => c.name === category);
  const finalTopic = isCustomCategory ? customTopic : topic;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const found = CATEGORIES.find(c => c.name === cat)!;
    setTopic(found.topics[0]);
    setUseCustomCategory(false);
    setCustomTopic('');
  };

  const handleCustomCategory = () => {
    setUseCustomCategory(true);
    setCustomTopic('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!finalTopic.trim()) { setError('Please select or enter a topic'); return; }
    setLoading(true);
    setError('');
    const settings: QuizSettings = {
      topic: finalTopic, category: isCustomCategory ? 'Custom' : category, numberOfQuestions, difficulty,
      timerEnabled, timeLimitSeconds, questionType,
    };
    setQuizSettings(settings);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate quiz');
      setCurrentQuiz({ topic: finalTopic, difficulty, questions: data.questions, category: isCustomCategory ? 'Custom' : category, questionType });
      router.push('/quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatLimit = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec === 0 ? `${m} min` : `${m}m ${sec}s`;
  };

  return (
    <main className="min-h-screen bg-[#f9f9f9]">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0f0f0f]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#f59e0b] rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">QUIZLY</span>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-2 text-sm font-semibold text-white/30 hover:text-white transition-colors tracking-widest uppercase"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </nav>

      {/* Hero */}
      <div className="bg-[#0f0f0f] px-6 pt-10 pb-16 border-b-2 border-[#f59e0b]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-bold tracking-[3px] uppercase mb-4">Quiz Generator</p>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tight uppercase">
            Test your<br />knowledge.
          </h1>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-xl -mt-5 relative z-10 overflow-hidden">
          <div className="h-1 bg-[#f59e0b]" />
          <div className="p-6 md:p-8 space-y-6">

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-[2px] uppercase">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-bold tracking-wide transition-all ${
                      category === cat.name && !isCustomCategory
                        ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                        : 'border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                <button
                  onClick={handleCustomCategory}
                  className={`text-xs px-3 py-1.5 rounded-full border font-bold tracking-wide transition-all ${
                    isCustomCategory
                      ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                      : 'border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                  }`}
                >
                  + Custom
                </button>
              </div>
            </div>

            {/* Topic */}
            {!isCustomCategory && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-[2px] uppercase">Topic</label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory?.topics.map(t => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      topic === t
                        ? 'bg-[#f59e0b] border-[#f59e0b] text-black font-bold'
                        : 'border-zinc-200 text-zinc-400 hover:border-[#f59e0b]/50 hover:text-[#f59e0b]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Custom Category + Topic input */}
            {isCustomCategory && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-[2px] uppercase">Your Topic</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => { setCustomTopic(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Ancient Greek Mythology, TypeScript, Jazz Music..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/10 transition-all text-sm font-medium"
              />
            </div>
            )}

            {/* Question Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-[2px] uppercase">Question Type</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'multiple', label: 'Multiple Choice' },
                  { value: 'truefalse', label: 'True / False' },
                  { value: 'mixed', label: 'Mixed' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setQuestionType(value)}
                    className={`py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all border ${
                      questionType === value
                        ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                        : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions + Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-zinc-400 tracking-[2px] uppercase">Questions</label>
                  <span className="text-sm font-black text-zinc-900">{numberOfQuestions}</span>
                </div>
                <input
                  type="range" min="5" max="20" value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-300 mt-1">
                  <span>5</span><span>20</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 tracking-[2px] uppercase">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all border ${
                        difficulty === level
                          ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                          : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-zinc-400" />
                  <label className="text-xs font-bold text-zinc-400 tracking-[2px] uppercase">Timer</label>
                </div>
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${timerEnabled ? 'bg-[#f59e0b]' : 'bg-zinc-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${timerEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              {timerEnabled && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Time limit</span>
                    <span className="text-xs font-black text-zinc-900">{formatLimit(timeLimitSeconds)}</span>
                  </div>
                  <input
                    type="range" min="60" max="600" step="30" value={timeLimitSeconds}
                    onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                    className="w-full accent-[#f59e0b] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-zinc-300 mt-1">
                    <span>1 min</span><span>10 min</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl text-red-600 p-3 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#f59e0b] hover:bg-[#e08d00] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs tracking-[2px] uppercase shadow-lg shadow-amber-200"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : 'Generate Quiz →'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-300 mt-4 font-medium">Progress is saved automatically to your browser</p>
      </div>
    </main>
  );
}
