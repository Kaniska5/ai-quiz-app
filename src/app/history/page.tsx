'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { formatTime } from '@/utils/quizStorage';
import {
  Trash2, RotateCcw, ArrowLeft, Clock, Target, Trophy,
  TrendingUp, Zap, BarChart2, Flame, Award,
} from 'lucide-react';

// ── Mini Bar Chart ───────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map(({ label, value, color }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-zinc-500">{value}%</span>
          <div className="w-full rounded-t-md transition-all duration-700" style={{
            height: `${(value / max) * 72}px`,
            background: color,
          }} />
          <span className="text-[9px] text-zinc-400 truncate w-full text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Streak Calculator ────────────────────────────────────────────────
function calculateStreak(history: { date: string }[]): number {
  if (history.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from(new Set(
    history.map(a => {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  )).sort((a, b) => b - a);

  let streak = 0;
  let expected = today.getTime();
  for (const date of dates) {
    if (date === expected) {
      streak++;
      expected -= 86400000;
    } else if (date < expected) {
      break;
    }
  }
  return streak;
}

// ── Score Trend Line ─────────────────────────────────────────────────
function TrendLine({ attempts }: { attempts: { score: number; totalQuestions: number; date: string }[] }) {
  const last10 = [...attempts].reverse().slice(-10);
  if (last10.length < 2) return (
    <p className="text-xs text-zinc-400 text-center py-4">Take at least 2 quizzes to see your trend</p>
  );

  const scores = last10.map(a => Math.round((a.score / a.totalQuestions) * 100));
  const max = 100;
  const w = 300;
  const h = 80;
  const step = w / (scores.length - 1);

  const points = scores.map((s, i) => ({
    x: i * step,
    y: h - (s / max) * h,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L 0 ${h} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f59e0b" />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

// ── Main History Page ────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const { quizHistory, deleteAttempt, setCurrentQuiz, setQuizSettings } = useQuiz();
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const filtered = quizHistory
    .filter(a => filter === 'All' || a.difficulty === filter)
    .filter(a => categoryFilter === 'All' || a.category === categoryFilter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === 'highest') return (b.score / b.totalQuestions) - (a.score / a.totalQuestions);
      return (a.score / a.totalQuestions) - (b.score / b.totalQuestions);
    });

  const totalQuizzes = quizHistory.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(quizHistory.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / totalQuizzes)
    : 0;
  const bestScore = totalQuizzes > 0
    ? Math.round(Math.max(...quizHistory.map(a => (a.score / a.totalQuestions) * 100)))
    : 0;
  const totalTime = quizHistory.reduce((sum, a) => sum + a.timeTaken, 0);
  const streak = calculateStreak(quizHistory);

  // Category performance data
  const categoryData = quizHistory.reduce((acc, attempt) => {
    const cat = attempt.category || 'General';
    if (!acc[cat]) acc[cat] = { scoreSum: 0, count: 0 };
    acc[cat].scoreSum += (attempt.score / attempt.totalQuestions) * 100;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { scoreSum: number; count: number }>);

  const categoryChartData = Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      avg: Math.round(data.scoreSum / data.count),
      count: data.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Difficulty breakdown for bar chart
  const difficultyData = (['Easy', 'Medium', 'Hard'] as const).map(d => {
    const attempts = quizHistory.filter(a => a.difficulty === d);
    const avg = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
      : 0;
    return {
      label: d,
      value: avg,
      color: d === 'Easy' ? '#10b981' : d === 'Medium' ? '#f59e0b' : '#ef4444',
    };
  }).filter(d => d.value > 0);

  const uniqueCategories = ['All', ...Array.from(new Set(quizHistory.map(a => a.category || 'General')))];

  const handleRetake = (attempt: typeof quizHistory[0]) => {
    setQuizSettings({
      topic: attempt.topic,
      category: attempt.category || 'General',
      numberOfQuestions: attempt.totalQuestions,
      difficulty: attempt.difficulty,
      timerEnabled: false,
      timeLimitSeconds: 300,
      questionType: 'multiple',
    });
    setCurrentQuiz({
      topic: attempt.topic,
      difficulty: attempt.difficulty,
      questions: attempt.questions,
      category: attempt.category || 'General',
      questionType: 'multiple',
    });
    router.push('/quiz');
  };

  return (
    <main className="min-h-screen bg-[#f9f9f9]">
      <nav className="bg-[#0f0f0f] px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#f59e0b] rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-black text-base tracking-tight">QUIZLY</span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </nav>

      <div className="bg-[#0f0f0f] px-4 md:px-6 pt-8 pb-16 border-b-2 border-[#f59e0b]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-bold tracking-[3px] uppercase mb-4">Your Progress</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-3">Quiz History.</h1>
          <p className="text-white/40 text-sm">{totalQuizzes} {totalQuizzes === 1 ? 'attempt' : 'attempts'} recorded</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12 space-y-4">

        {/* ── Stats Dashboard ── */}
        {totalQuizzes > 0 && (
          <div className="bg-white rounded-2xl shadow-xl -mt-5 relative z-10 overflow-hidden">
            <div className="h-1 bg-[#f59e0b]" />
            <div className="p-5 md:p-6 space-y-6">

              {/* Top stats */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
                  <h2 className="text-xs font-black text-zinc-900 tracking-[2px] uppercase">Performance Overview</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Quizzes', value: String(totalQuizzes), icon: Target },
                    { label: 'Avg Score', value: `${avgScore}%`, icon: BarChart2 },
                    { label: 'Best Score', value: `${bestScore}%`, icon: Trophy },
                    { label: 'Total Time', value: formatTime(totalTime), icon: Clock },
                    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, icon: Flame },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="text-center p-3 md:p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <Icon className="w-3.5 h-3.5 text-[#f59e0b] mx-auto mb-1.5" />
                      <p className="text-lg md:text-xl font-black text-zinc-900">{value}</p>
                      <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score trend */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
                  <h3 className="text-xs font-black text-zinc-900 tracking-[2px] uppercase">Score Trend</h3>
                  <span className="text-[10px] text-zinc-400 ml-1">(last 10 quizzes)</span>
                </div>
                <TrendLine attempts={quizHistory} />
              </div>

              {/* Difficulty breakdown */}
              {difficultyData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-[#f59e0b]" />
                    <h3 className="text-xs font-black text-zinc-900 tracking-[2px] uppercase">Avg Score by Difficulty</h3>
                  </div>
                  <BarChart data={difficultyData} />
                </div>
              )}

              {/* Category performance */}
              {categoryChartData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-[#f59e0b]" />
                    <h3 className="text-xs font-black text-zinc-900 tracking-[2px] uppercase">Category Performance</h3>
                  </div>
                  <div className="space-y-2.5">
                    {categoryChartData.map(({ name, avg, count }) => (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-700">{name}</span>
                            <span className="text-xs text-zinc-400">({count} quiz{count > 1 ? 'zes' : ''})</span>
                          </div>
                          <span className={`text-xs font-black ${avg >= 80 ? 'text-emerald-600' : avg >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {avg}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${avg >= 80 ? 'bg-emerald-500' : avg >= 50 ? 'bg-[#f59e0b]' : 'bg-red-400'}`}
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className={`bg-white rounded-2xl shadow-lg p-4 md:p-5 border border-zinc-100 space-y-3 ${totalQuizzes === 0 ? '-mt-5 relative z-10' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Difficulty:</span>
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase transition-all border ${
                    filter === f
                      ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                      : 'border-zinc-200 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="text-xs font-bold border border-zinc-200 rounded-xl px-3 py-2 text-zinc-400 bg-zinc-50 focus:outline-none focus:border-zinc-900 uppercase tracking-widest"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Category:</span>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                  categoryFilter === cat
                    ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                    : 'border-zinc-200 text-zinc-400 hover:border-zinc-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty State ── */}
        {filtered.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-lg p-12 md:p-16 text-center">
            <Trophy className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm font-bold mb-1">No quizzes yet</p>
            <p className="text-zinc-300 text-xs mb-6">Take a quiz to see your history here</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#f59e0b] hover:bg-[#e08d00] text-black px-6 py-2.5 rounded-xl text-xs font-black transition-all tracking-[2px] uppercase"
            >
              Start a Quiz →
            </button>
          </div>
        )}

        {/* ── History List ── */}
        <div className="space-y-4">
          {filtered.map(attempt => {
            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
            const scoreColor = percentage >= 80 ? 'text-emerald-600'
              : percentage >= 50 ? 'text-zinc-900' : 'text-red-500';

            return (
              <div key={attempt.id} className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-black text-zinc-900 capitalize text-base tracking-tight">{attempt.topic}</h3>
                      {attempt.category && (
                        <span className="text-xs font-bold text-[#f59e0b] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full tracking-wide uppercase">
                          {attempt.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 font-medium">
                      {new Date(attempt.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-2xl md:text-3xl font-black ${scoreColor}`}>{percentage}%</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium mb-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {attempt.score}/{attempt.totalQuestions} correct
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(attempt.timeTaken)}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold tracking-widest uppercase ${
                    attempt.difficulty === 'Easy' ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                      : attempt.difficulty === 'Medium' ? 'border-amber-200 text-amber-600 bg-amber-50'
                      : 'border-red-200 text-red-500 bg-red-50'
                  }`}>{attempt.difficulty}</span>
                  {attempt.hintsUsed > 0 && (
                    <span className="text-amber-500">{attempt.hintsUsed} hint{attempt.hintsUsed > 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="w-full bg-zinc-100 rounded-full h-[3px] mb-4">
                  <div
                    className={`h-[3px] rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-[#f59e0b]' : 'bg-red-400'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetake(attempt)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-zinc-800 text-white text-xs font-black py-2.5 rounded-xl transition-all tracking-[2px] uppercase"
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
