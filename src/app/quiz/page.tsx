'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { generateId, formatTime } from '@/utils/quizStorage';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, X, Lightbulb, Loader2, Zap } from 'lucide-react';

// ── Question Navigation Map ──────────────────────────────────────────
function QuestionNavMap({
  total,
  current,
  answers,
  onJump,
}: {
  total: number;
  current: number;
  answers: { questionId: number }[];
  onJump: (index: number) => void;
}) {
  const getStatus = (index: number) => {
    if (index === current) return 'current';
    const a = answers.find(a => a.questionId === index);
    if (!a) return 'unanswered';
    return 'answered';
  };

  const styleMap: Record<string, string> = {
    current: 'bg-[#f59e0b] border-[#f59e0b] text-black font-black',
    answered: 'bg-white/20 border-white/20 text-white font-bold',
    unanswered: 'bg-transparent border-white/20 text-white/40 font-medium',
  };

  return (
    <div className="bg-[#0f0f0f] rounded-2xl p-4 mb-4">
      <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/30 mb-3">Jump to Question</p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={`w-9 h-9 rounded-xl border text-xs transition-all ${styleMap[getStatus(i)]}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: 'bg-[#f59e0b]', label: 'Current' },
          { color: 'bg-white/20', label: 'Answered' },
          { color: 'bg-transparent border border-white/20', label: 'Unanswered' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
            <span className="text-[10px] text-white/30 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Quiz Page ───────────────────────────────────────────────────
export default function QuizPage() {
  const router = useRouter();
  const {
    currentQuiz, currentQuestionIndex, userAnswers,
    startTime, quizSettings, answerQuestion,
    nextQuestion, previousQuestion, jumpToQuestion, saveAttempt, resetQuiz,
    hintsUsed, incrementHints,
  } = useQuiz();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!currentQuiz) { router.push('/'); return; }
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
      setTimeElapsed(elapsed);
      if (quizSettings?.timerEnabled && quizSettings.timeLimitSeconds) {
        if (quizSettings.timeLimitSeconds - elapsed <= 0) {
          clearInterval(timer);
          const correctCount = userAnswers.filter(a => a.isCorrect).length;
          saveAttempt({
            id: generateId(),
            topic: currentQuiz.topic,
            category: currentQuiz.category || 'General',
            difficulty: currentQuiz.difficulty,
            score: Math.max(0, correctCount - hintsUsed * 0.25),
            totalQuestions: currentQuiz.questions.length,
            timeTaken: quizSettings.timeLimitSeconds,
            date: new Date().toISOString(),
            answers: userAnswers,
            questions: currentQuiz.questions,
            hintsUsed,
          });
          router.push('/results');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuiz, startTime, router, quizSettings, userAnswers, saveAttempt, hintsUsed]);

  useEffect(() => {
    const existing = userAnswers.find(a => a.questionId === currentQuestionIndex);
    setSelectedAnswer(existing?.selectedAnswer || '');
    setHint('');
    setShowHint(false);
  }, [currentQuestionIndex, userAnswers]);

  if (!currentQuiz) return null;

  const question = currentQuiz.questions[currentQuestionIndex];
  const totalQuestions = currentQuiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const answeredCount = userAnswers.length;
  const isCountdown = quizSettings?.timerEnabled && quizSettings.timeLimitSeconds;
  const displayTime = isCountdown ? Math.max(0, quizSettings!.timeLimitSeconds - timeElapsed) : timeElapsed;
  const isLowTime = isCountdown && displayTime <= 30;
  const isTrueFalse = question.type === 'truefalse' || question.options.length === 2;

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswer(option);
    answerQuestion({
      questionId: currentQuestionIndex,
      selectedAnswer: option,
      isCorrect: option === question.correctAnswer,
    });
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const response = await fetch('/api/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ question: question.question, options: question.options }),
      });
      const data = await response.json();
      if (data.hint) {
        setHint(data.hint);
        setShowHint(true);
        incrementHints();
      }
    } catch {
      setHint('Could not load hint. Try again.');
      setShowHint(true);
    } finally {
      setHintLoading(false);
    }
  };

  const handleFinish = () => {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    saveAttempt({
      id: generateId(),
      topic: currentQuiz.topic,
      category: currentQuiz.category || 'General',
      difficulty: currentQuiz.difficulty,
      score: Math.max(0, correctCount - hintsUsed * 0.25),
      totalQuestions,
      timeTaken: timeElapsed,
      date: new Date().toISOString(),
      answers: userAnswers,
      questions: currentQuiz.questions,
      hintsUsed,
    });
    router.push('/results');
  };

  // Jump to question handler — uses previousQuestion/nextQuestion repeatedly
  // We expose it via context or calculate offset here
  const handleJumpToQuestion = (index: number) => jumpToQuestion(index);

  return (
    <main className="min-h-screen bg-[#f9f9f9]">
      <nav className="bg-[#0f0f0f] px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#f59e0b] rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-black text-base tracking-tight">QUIZLY</span>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isLowTime ? 'text-red-400' : 'text-white/40'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(displayTime)}</span>
          {isCountdown && <span className="text-white/20 ml-1 hidden sm:inline">left</span>}
        </div>
      </nav>

      <div className="bg-[#0f0f0f] px-4 md:px-6 pt-6 md:pt-8 pb-14 md:pb-16 border-b-2 border-[#f59e0b]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
            <span className="text-[#f59e0b] text-xs font-bold tracking-[3px] uppercase">{currentQuiz.topic}</span>
            <span className="text-white/20 hidden sm:inline">·</span>
            <span className="text-white/30 text-xs font-medium uppercase tracking-wider hidden sm:inline">{currentQuiz.category}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none mb-3 md:mb-4">
            Question {currentQuestionIndex + 1}<span className="text-white/20">/{totalQuestions}</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border tracking-widest uppercase ${
              currentQuiz.difficulty === 'Easy' ? 'border-emerald-600/40 text-emerald-400'
                : currentQuiz.difficulty === 'Medium' ? 'border-[#f59e0b]/40 text-[#f59e0b]'
                : 'border-red-500/40 text-red-400'
            }`}>{currentQuiz.difficulty}</span>
            <span className="text-white/20 text-xs">{answeredCount} answered</span>
            {hintsUsed > 0 && (
              <span className="text-xs text-amber-400/60 font-medium">-{(hintsUsed * 0.25).toFixed(2)} pts from hints</span>
            )}
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-white/10 rounded-full h-[3px]">
              <div className="bg-[#f59e0b] h-[3px] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {isCountdown && (
              <div className="w-full bg-white/10 rounded-full h-[3px]">
                <div
                  className={`h-[3px] rounded-full transition-all duration-1000 ${isLowTime ? 'bg-red-400' : 'bg-white/30'}`}
                  style={{ width: `${(displayTime / quizSettings!.timeLimitSeconds) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12">

        {/* ── Question Navigation Map ── */}
        <div className="-mt-5 relative z-10 mb-0">
          <QuestionNavMap
            total={totalQuestions}
            current={currentQuestionIndex}
            answers={userAnswers}
            onJump={handleJumpToQuestion}
          />
        </div>

        {/* ── Question Card ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="h-1 bg-[#f59e0b]" />
          <div className="p-5 md:p-8">
            <div className="flex items-start justify-between gap-3 mb-5 md:mb-6">
              <h2 className="text-base md:text-lg font-bold text-zinc-900 leading-relaxed">{question.question}</h2>
              {isTrueFalse && (
                <span className="text-xs font-black text-amber-500 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap tracking-wide uppercase flex-shrink-0">
                  T/F
                </span>
              )}
            </div>

            <div className={`gap-2 md:gap-3 ${isTrueFalse ? 'grid grid-cols-2' : 'flex flex-col'}`}>
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full text-left px-4 md:px-5 py-3 md:py-4 rounded-xl border transition-all flex items-center gap-3 md:gap-4 text-sm font-medium ${
                    selectedAnswer === option
                      ? 'border-[#0f0f0f] bg-[#0f0f0f] text-white'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    selectedAnswer === option ? 'border-white bg-white text-zinc-900' : 'border-zinc-200 text-zinc-400'
                  }`}>
                    {isTrueFalse ? (option === 'True' ? 'T' : 'F') : String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-xs md:text-sm">{option}</span>
                </button>
              ))}
            </div>

            {showHint && hint && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-amber-800">{hint}</p>
              </div>
            )}

            <div className="mt-4 md:mt-5 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={handleGetHint}
                disabled={hintLoading || showHint}
                className="flex items-center gap-1.5 md:gap-2 text-xs text-zinc-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium border border-zinc-200 hover:border-amber-300 px-3 py-1.5 md:py-2 rounded-lg"
              >
                {hintLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                <span>{hintLoading ? 'Getting hint...' : showHint ? 'Hint used (-0.25)' : 'Get hint (-0.25)'}</span>
              </button>
              <span className="text-xs text-zinc-300 font-medium">{currentQuestionIndex + 1} / {totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:gap-3">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-400 text-xs md:text-sm font-bold disabled:opacity-30 hover:border-zinc-900 hover:text-zinc-900 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {isLastQuestion ? (
            <button
              onClick={handleFinish}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#e08d00] text-black text-xs font-black py-3 rounded-xl transition-all tracking-[2px] uppercase shadow-lg shadow-amber-200"
            >
              <CheckCircle className="w-4 h-4" />
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-zinc-800 text-white text-xs font-black py-3 rounded-xl transition-all tracking-[2px] uppercase"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center mt-4 md:mt-5">
          <button
            onClick={() => { resetQuiz(); router.push('/'); }}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-red-400 transition-colors mx-auto font-medium"
          >
            <X className="w-3 h-3" />
            Quit Quiz
          </button>
        </div>
      </div>
    </main>
  );
}
