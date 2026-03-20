'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { formatTime } from '@/utils/quizStorage';
import { CheckCircle, XCircle, RotateCcw, Home, Clock, Target, Trophy } from 'lucide-react';

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
    if (percentage >= 90) return { label: 'Excellent.', color: 'text-emerald-500' };
    if (percentage >= 75) return { label: 'Good.', color: 'text-white' };
    if (percentage >= 50) return { label: 'Average.', color: 'text-white' };
    return { label: 'Needs Work.', color: 'text-red-400' };
  };

  const grade = getGrade();

  return (
    <main className="min-h-screen bg-[#f9f9f9]">

      {/* Nav */}
      <nav className="bg-white border-b border-[#ebebeb] px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[#0f0f0f] font-black text-base tracking-tight">QUIZLY</span>
        </div>
      </nav>

      {/* Hero — full width */}
      <div className="bg-[#0f0f0f] px-6 pt-10 pb-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-semibold tracking-[3px] uppercase mb-4">
            Quiz Complete
          </p>
          <h1 className={`text-5xl font-black uppercase tracking-tight leading-none mb-3 ${grade.color}`}>
            {grade.label}
          </h1>
          <p className="text-white/40 text-sm">
            {latestAttempt.score} of {latestAttempt.totalQuestions} correct on{' '}
            <span className="text-white/70 capitalize">{latestAttempt.topic}</span>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12 space-y-4">

        {/* Score card */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-8 -mt-6 relative z-10">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#f0f0f0]">
            <div>
              <p className="text-xs font-bold text-[#aaa] tracking-[2px] uppercase mb-1">Overall Score</p>
              <p className="text-6xl font-black text-[#0f0f0f]">{percentage}%</p>
            </div>
            <Trophy className="w-12 h-12 text-[#e8e8e8]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Target, label: 'Score', value: `${latestAttempt.score}/${latestAttempt.totalQuestions}` },
              { icon: Clock, label: 'Time', value: formatTime(latestAttempt.timeTaken) },
              { icon: Trophy, label: 'Difficulty', value: latestAttempt.difficulty },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-4 bg-[#f9f9f9] rounded-xl border border-[#e8e8e8]">
                <Icon className="w-4 h-4 text-[#f59e0b] mx-auto mb-2" />
                <p className="text-base font-black text-[#0f0f0f]">{value}</p>
                <p className="text-xs font-bold text-[#aaa] tracking-widest uppercase mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-8">
          <h2 className="text-xs font-black text-[#0f0f0f] tracking-[2px] uppercase mb-6">
            Question Breakdown
          </h2>
          <div className="space-y-3">
            {currentQuiz.questions.map((question, index) => {
              const answer = userAnswers.find(a => a.questionId === index);
              const isCorrect = answer?.isCorrect;
              const wasAnswered = !!answer;
              return (
                <div key={index} className={`p-5 rounded-xl border ${
                  !wasAnswered ? 'border-[#e8e8e8] bg-[#f9f9f9]'
                    : isCorrect ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {!wasAnswered ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#ccc] mt-0.5 flex-shrink-0" />
                    ) : isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0f0f0f] mb-2">
                        {index + 1}. {question.question}
                      </p>
                      {wasAnswered && !isCorrect && (
                        <p className="text-xs text-red-500 mb-1 font-medium">
                          Your answer: {answer?.selectedAnswer}
                        </p>
                      )}
                      <p className="text-xs text-emerald-700 font-bold mb-1">
                        Correct: {question.correctAnswer}
                      </p>
                      <p className="text-xs text-[#aaa] italic">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { resetQuiz(); router.push('/'); }}
            className="flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white text-xs font-black py-4 rounded-xl transition-all tracking-[2px] uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Quiz
          </button>
          <button
            onClick={() => router.push('/history')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-[#f9f9f9] text-[#0f0f0f] text-xs font-black py-4 rounded-xl border border-[#e8e8e8] transition-all tracking-[2px] uppercase"
          >
            <Home className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>
    </main>
  );
}