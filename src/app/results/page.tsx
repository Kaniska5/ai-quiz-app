'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { formatTime } from '@/utils/quizStorage';
import { CheckCircle, XCircle, RotateCcw, Home, Clock, Target, Trophy, Lightbulb, Zap } from 'lucide-react';

// ── Animated Score Ring ──────────────────────────────────────────────
function ScoreRing({ percentage, score, total, timeTaken, difficulty, category }: {
  percentage: number;
  score: number;
  total: number;
  timeTaken: number;
  difficulty: string;
  category: string;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [strokeDash, setStrokeDash] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const getColor = () => {
    if (percentage >= 80) return '#10b981'; // emerald
    if (percentage >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getLabel = () => {
    if (percentage >= 90) return 'Excellent performance';
    if (percentage >= 75) return 'Good performance';
    if (percentage >= 50) return 'Average performance';
    return 'Needs improvement';
  };

  useEffect(() => {
    // Animate counter and ring on mount
    const duration = 1200;
    const start = performance.now();
    const raf = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const current = Math.round(ease * percentage);
      setDisplayPct(current);
      setStrokeDash(ease * percentage * circumference / 100);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [percentage, circumference]);

  const color = getColor();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-[#0f0f0f] rounded-2xl">
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: 'stroke 0.3s' }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white leading-none">{displayPct}%</span>
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-white/60 mt-1">Score</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-white font-bold text-base">{getLabel()}</span>
        </div>
        <p className="text-white font-semibold text-sm">
          {score}/{total} correct · {formatTime(timeTaken)}
        </p>
        <p className="text-white/70 font-medium text-sm">
          {difficulty} · {category}
        </p>
      </div>
    </div>
  );
}

// ── Main Results Page ────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const { currentQuiz, userAnswers, quizHistory, resetQuiz } = useQuiz();

  useEffect(() => {
    if (!currentQuiz) router.push('/');
  }, [currentQuiz, router]);

  if (!currentQuiz) return null;
  const latestAttempt = quizHistory[0];
  if (!latestAttempt) return null;

  const percentage = Math.round((latestAttempt.score / latestAttempt.totalQuestions) * 100);

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Excellent.', color: 'text-emerald-400' };
    if (percentage >= 75) return { label: 'Good.', color: 'text-white' };
    if (percentage >= 50) return { label: 'Average.', color: 'text-white' };
    return { label: 'Needs Work.', color: 'text-red-400' };
  };

  const grade = getGrade();

  return (
    <main className="min-h-screen bg-[#f9f9f9]">
      <nav className="bg-[#0f0f0f] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#f59e0b] rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-black text-base tracking-tight">QUIZLY</span>
        </div>
      </nav>

      <div className="bg-[#0f0f0f] px-6 pt-8 pb-16 border-b-2 border-[#f59e0b]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-bold tracking-[3px] uppercase mb-4">Quiz Complete</p>
          <h1 className={`text-5xl font-black uppercase tracking-tight leading-none mb-3 ${grade.color}`}>
            {grade.label}
          </h1>
          <p className="text-white/80 font-medium text-sm">
            {latestAttempt.score} of {latestAttempt.totalQuestions} correct on{' '}
            <span className="text-white font-bold capitalize">{latestAttempt.topic}</span>
            {latestAttempt.hintsUsed > 0 && (
              <span className="text-amber-400"> · {latestAttempt.hintsUsed} hint{latestAttempt.hintsUsed > 1 ? 's' : ''} used</span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12 space-y-4">
        {/* Score Ring Card */}
        <div className="bg-white rounded-2xl shadow-xl -mt-5 relative z-10 overflow-hidden">
          <div className="h-1 bg-[#f59e0b]" />
          <div className="p-6 md:p-8">
            <ScoreRing
              percentage={percentage}
              score={latestAttempt.score}
              total={latestAttempt.totalQuestions}
              timeTaken={latestAttempt.timeTaken}
              difficulty={latestAttempt.difficulty}
              category={latestAttempt.category || 'General'}
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { icon: Target, label: 'Score', value: `${latestAttempt.score}/${latestAttempt.totalQuestions}` },
                { icon: Clock, label: 'Time', value: formatTime(latestAttempt.timeTaken) },
                { icon: Trophy, label: 'Difficulty', value: latestAttempt.difficulty },
                { icon: Lightbulb, label: 'Hints', value: `${latestAttempt.hintsUsed} used` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <Icon className="w-4 h-4 text-[#f59e0b] mx-auto mb-2" />
                  <p className="text-sm font-black text-zinc-900">{value}</p>
                  <p className="text-[10px] font-bold text-zinc-600 tracking-wide uppercase mt-0.5 truncate">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-zinc-100">
          <h2 className="text-xs font-black text-zinc-900 tracking-[2px] uppercase mb-6">Question Breakdown</h2>
          <div className="space-y-3">
            {currentQuiz.questions.map((question, index) => {
              const answer = userAnswers.find(a => a.questionId === index);
              const isCorrect = answer?.isCorrect;
              const wasAnswered = !!answer;
              return (
                <div key={index} className={`p-5 rounded-xl border ${
                  !wasAnswered ? 'border-zinc-200 bg-zinc-50'
                    : isCorrect ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {!wasAnswered ? (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 mt-0.5 flex-shrink-0" />
                    ) : isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900 mb-2">{index + 1}. {question.question}</p>
                      {wasAnswered && !isCorrect && (
                        <p className="text-xs text-red-600 mb-1 font-bold">Your answer: {answer?.selectedAnswer}</p>
                      )}
                      <p className="text-xs text-emerald-800 font-bold mb-1">Correct: {question.correctAnswer}</p>
                      <p className="text-xs text-zinc-600 font-medium">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { resetQuiz(); router.push('/'); }}
            className="flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e08d00] text-black text-xs font-black py-4 rounded-xl transition-all tracking-[2px] uppercase shadow-lg shadow-amber-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Quiz
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-900 text-xs font-black py-4 rounded-xl border border-zinc-200 transition-all tracking-[2px] uppercase"
          >
            <Home className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>
    </main>
  );
}
