'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/context/QuizContext';
import { generateId, formatTime } from '@/utils/quizStorage';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, X } from 'lucide-react';

export default function QuizPage() {
  const router = useRouter();
  const {
    currentQuiz, currentQuestionIndex, userAnswers,
    startTime, quizSettings, answerQuestion,
    nextQuestion, previousQuestion, saveAttempt, resetQuiz,
  } = useQuiz();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

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
            difficulty: currentQuiz.difficulty,
            score: correctCount,
            totalQuestions: currentQuiz.questions.length,
            timeTaken: quizSettings.timeLimitSeconds,
            date: new Date().toISOString(),
            answers: userAnswers,
            questions: currentQuiz.questions,
          });
          router.push('/results');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuiz, startTime, router, quizSettings, userAnswers, saveAttempt]);

  useEffect(() => {
    const existing = userAnswers.find(a => a.questionId === currentQuestionIndex);
    setSelectedAnswer(existing?.selectedAnswer || '');
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

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswer(option);
    answerQuestion({
      questionId: currentQuestionIndex,
      selectedAnswer: option,
      isCorrect: option === question.correctAnswer,
    });
  };

  const handleFinish = () => {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    saveAttempt({
      id: generateId(),
      topic: currentQuiz.topic,
      difficulty: currentQuiz.difficulty,
      score: correctCount,
      totalQuestions,
      timeTaken: timeElapsed,
      date: new Date().toISOString(),
      answers: userAnswers,
      questions: currentQuiz.questions,
    });
    router.push('/results');
  };

  return (
    <main className="min-h-screen bg-[#f9f9f9]">

      {/* Nav */}
      <nav className="bg-white border-b border-[#ebebeb] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[#0f0f0f] font-black text-base tracking-tight">QUIZLY</span>
        </div>
        <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isLowTime ? 'text-red-500' : 'text-[#aaa]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(displayTime)}</span>
          {isCountdown && <span className="text-[#ccc] ml-1">left</span>}
        </div>
      </nav>

      {/* Hero — full width */}
      <div className="bg-[#0f0f0f] px-6 pt-8 pb-14">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#f59e0b] text-xs font-semibold tracking-[3px] uppercase mb-3">
            {currentQuiz.topic}
          </p>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-3">
            Question {currentQuestionIndex + 1}
            <span className="text-white/30">/{totalQuestions}</span>
          </h1>
          <div className="flex items-center gap-4 mb-5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border tracking-widest uppercase ${
              currentQuiz.difficulty === 'Easy'
                ? 'border-emerald-600/40 text-emerald-400'
                : currentQuiz.difficulty === 'Medium'
                ? 'border-[#f59e0b]/40 text-[#f59e0b]'
                : 'border-red-500/40 text-red-400'
            }`}>
              {currentQuiz.difficulty}
            </span>
            <span className="text-white/30 text-xs font-medium">{answeredCount} answered</span>
          </div>

          {/* Progress bars */}
          <div className="space-y-1.5">
            <div className="w-full bg-white/10 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {isCountdown && (
              <div className="w-full bg-white/10 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-1000 ${isLowTime ? 'bg-red-400' : 'bg-white/40'}`}
                  style={{ width: `${(displayTime / quizSettings!.timeLimitSeconds) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card — wider than hero text but still contained */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl shadow-lg p-8 mb-4 -mt-6 relative z-10">
          <h2 className="text-lg font-bold text-[#0f0f0f] leading-relaxed mb-8">
            {question.question}
          </h2>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center gap-4 text-sm font-medium ${
                  selectedAnswer === option
                    ? 'border-[#0f0f0f] bg-[#0f0f0f] text-white'
                    : 'border-[#e8e8e8] text-[#555] hover:border-[#0f0f0f]'
                }`}
              >
                <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  selectedAnswer === option
                    ? 'border-white bg-white text-[#0f0f0f]'
                    : 'border-[#e8e8e8] text-[#aaa]'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#e8e8e8] bg-white text-[#aaa] text-sm font-bold disabled:opacity-30 hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          {isLastQuestion ? (
            <button
              onClick={handleFinish}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white text-xs font-black py-3 rounded-xl transition-all tracking-[2px] uppercase"
            >
              <CheckCircle className="w-4 h-4" />
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white text-xs font-black py-3 rounded-xl transition-all tracking-[2px] uppercase"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-center mt-5">
          <button
            onClick={() => { resetQuiz(); router.push('/'); }}
            className="flex items-center gap-1.5 text-xs text-[#ccc] hover:text-red-400 transition-colors mx-auto font-medium"
          >
            <X className="w-3 h-3" />
            Quit Quiz
          </button>
        </div>
      </div>
    </main>
  );
}