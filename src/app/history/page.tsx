'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { formatTime } from '@/utils/quizStorage';
import { Trash2, RotateCcw, ArrowLeft, Clock, Target, Trophy } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { quizHistory, deleteAttempt, setCurrentQuiz, setQuizSettings } = useQuiz();
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const filtered = quizHistory
    .filter(a => filter === 'All' || a.difficulty === filter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === 'highest') return (b.score / b.totalQuestions) - (a.score / a.totalQuestions);
      return (a.score / a.totalQuestions) - (b.score / b.totalQuestions);
    });

  const handleRetake = (attempt: typeof quizHistory[0]) => {
    setQuizSettings({
      topic: attempt.topic,
      numberOfQuestions: attempt.totalQuestions,
      difficulty: attempt.difficulty,
      timerEnabled: false,
      timeLimitSeconds: 300,
    });
    setCurrentQuiz({
      topic: attempt.topic,
      difficulty: attempt.difficulty,
      questions: attempt.questions,
    });
    router.push('/quiz');
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
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-bold text-[#aaa] hover:text-[#0f0f0f] transition-colors tracking-widest uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </nav>

      {/* Hero — full width */}
      <div className="bg-[#0f0f0f] px-6 pt-10 pb-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-semibold tracking-[3px] uppercase mb-4">
            Your Progress
          </p>
          <h1 className="text-5xl font-black text-white uppercase tracking-tight leading-none mb-3">
            Quiz History.
          </h1>
          <p className="text-white/40 text-sm">
            {quizHistory.length} {quizHistory.length === 1 ? 'attempt' : 'attempts'} recorded
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12 space-y-4">

        {/* Filters */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-5 -mt-6 relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border ${
                  filter === f
                    ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                    : 'border-[#e8e8e8] text-[#aaa] hover:border-[#0f0f0f] hover:text-[#0f0f0f]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="text-xs font-bold border border-[#e8e8e8] rounded-xl px-3 py-2 text-[#aaa] bg-[#f9f9f9] focus:outline-none focus:border-[#0f0f0f] uppercase tracking-widest"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Score</option>
            <option value="lowest">Lowest Score</option>
          </select>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-16 text-center">
            <Trophy className="w-10 h-10 text-[#e8e8e8] mx-auto mb-4" />
            <p className="text-[#aaa] text-sm font-bold mb-1">No quizzes yet</p>
            <p className="text-[#ccc] text-xs mb-6">Take a quiz to see your history here</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#0f0f0f] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#1a1a1a] transition-all tracking-[2px] uppercase"
            >
              Start a Quiz →
            </button>
          </div>
        )}

        {/* History list */}
        <div className="space-y-4">
          {filtered.map(attempt => {
            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
            const scoreColor = percentage >= 80 ? 'text-emerald-600'
              : percentage >= 50 ? 'text-[#0f0f0f]'
              : 'text-red-500';

            return (
              <div key={attempt.id} className="bg-white border border-[#e8e8e8] rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-black text-[#0f0f0f] capitalize text-base tracking-tight">
                      {attempt.topic}
                    </h3>
                    <p className="text-xs text-[#ccc] mt-0.5 font-medium">
                      {new Date(attempt.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-3xl font-black ${scoreColor}`}>
                    {percentage}%
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#aaa] font-medium mb-4">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {attempt.score}/{attempt.totalQuestions} correct
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(attempt.timeTaken)}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold tracking-widest uppercase ${
                    attempt.difficulty === 'Easy'
                      ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                      : attempt.difficulty === 'Medium'
                      ? 'border-amber-200 text-amber-600 bg-amber-50'
                      : 'border-red-200 text-red-500 bg-red-50'
                  }`}>
                    {attempt.difficulty}
                  </span>
                </div>

                <div className="w-full bg-[#f0f0f0] rounded-full h-1 mb-4">
                  <div
                    className={`h-1 rounded-full ${
                      percentage >= 80 ? 'bg-emerald-500'
                        : percentage >= 50 ? 'bg-[#0f0f0f]'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetake(attempt)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white text-xs font-black py-2.5 rounded-xl transition-all tracking-[2px] uppercase"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retake
                  </button>
                  <button
                    onClick={() => deleteAttempt(attempt.id)}
                    className="flex items-center justify-center px-4 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold py-2.5 rounded-xl border border-red-200 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}