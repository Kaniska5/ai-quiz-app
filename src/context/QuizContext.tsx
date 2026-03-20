'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quiz, QuizAttempt, QuizSettings, UserAnswer } from '@/types';

interface QuizContextType {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  quizSettings: QuizSettings | null;
  startTime: number | null;
  hintsUsed: number;
  quizHistory: QuizAttempt[];
  setCurrentQuiz: (quiz: Quiz) => void;
  setQuizSettings: (settings: QuizSettings) => void;
  answerQuestion: (answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  saveAttempt: (attempt: QuizAttempt) => void;
  resetQuiz: () => void;
  deleteAttempt: (id: string) => void;
  incrementHints: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [currentQuiz, setCurrentQuizState] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('quizHistory');
    if (saved) setQuizHistory(JSON.parse(saved));
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCurrentQuizState(progress.currentQuiz);
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      setUserAnswers(progress.userAnswers);
      setQuizSettings(progress.quizSettings);
      setStartTime(progress.startTime);
      setHintsUsed(progress.hintsUsed || 0);
    }
  }, []);

  useEffect(() => {
    if (currentQuiz) {
      localStorage.setItem('quizProgress', JSON.stringify({
        currentQuiz, currentQuestionIndex, userAnswers, quizSettings, startTime, hintsUsed,
      }));
    }
  }, [currentQuiz, currentQuestionIndex, userAnswers, quizSettings, startTime, hintsUsed]);

  const answerQuestion = (answer: UserAnswer) => {
    setUserAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === answer.questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = answer;
        return updated;
      }
      return [...prev, answer];
    });
  };

  const nextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1)
      setCurrentQuestionIndex(prev => prev + 1);
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < (currentQuiz?.questions.length ?? 0))
      setCurrentQuestionIndex(index);
  };

  const saveAttempt = (attempt: QuizAttempt) => {
    const updated = [attempt, ...quizHistory];
    setQuizHistory(updated);
    localStorage.setItem('quizHistory', JSON.stringify(updated));
  };

  const resetQuiz = () => {
    setCurrentQuizState(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizSettings(null);
    setStartTime(null);
    setHintsUsed(0);
    localStorage.removeItem('quizProgress');
  };

  const deleteAttempt = (id: string) => {
    const updated = quizHistory.filter(a => a.id !== id);
    setQuizHistory(updated);
    localStorage.setItem('quizHistory', JSON.stringify(updated));
  };

  const setCurrentQuiz = (quiz: Quiz) => {
    setCurrentQuizState(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setStartTime(Date.now());
    setHintsUsed(0);
  };

  const incrementHints = () => setHintsUsed(prev => prev + 1);

  return (
    <QuizContext.Provider value={{
      currentQuiz, currentQuestionIndex, userAnswers, quizSettings,
      startTime, hintsUsed, quizHistory, setCurrentQuiz, setQuizSettings,
      answerQuestion, nextQuestion, previousQuestion, jumpToQuestion,
      saveAttempt, resetQuiz, deleteAttempt, incrementHints,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within QuizProvider');
  return context;
}
