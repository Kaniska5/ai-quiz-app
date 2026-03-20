'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quiz, QuizAttempt, QuizSettings, UserAnswer } from '@/types';

interface QuizContextType {
  // Current quiz state
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  quizSettings: QuizSettings | null;
  startTime: number | null;

  // History
  quizHistory: QuizAttempt[];

  // Actions
  setCurrentQuiz: (quiz: Quiz) => void;
  setQuizSettings: (settings: QuizSettings) => void;
  answerQuestion: (answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  saveAttempt: (attempt: QuizAttempt) => void;
  resetQuiz: () => void;
  deleteAttempt: (id: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);

  // Load history from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('quizHistory');
    if (saved) setQuizHistory(JSON.parse(saved));

    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCurrentQuiz(progress.currentQuiz);
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      setUserAnswers(progress.userAnswers);
      setQuizSettings(progress.quizSettings);
      setStartTime(progress.startTime);
    }
  }, []);

  // Auto-save progress whenever quiz state changes
  useEffect(() => {
    if (currentQuiz) {
      localStorage.setItem('quizProgress', JSON.stringify({
        currentQuiz,
        currentQuestionIndex,
        userAnswers,
        quizSettings,
        startTime,
      }));
    }
  }, [currentQuiz, currentQuestionIndex, userAnswers, quizSettings, startTime]);

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
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const saveAttempt = (attempt: QuizAttempt) => {
    const updated = [attempt, ...quizHistory];
    setQuizHistory(updated);
    localStorage.setItem('quizHistory', JSON.stringify(updated));
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizSettings(null);
    setStartTime(null);
    localStorage.removeItem('quizProgress');
  };

  const deleteAttempt = (id: string) => {
    const updated = quizHistory.filter(a => a.id !== id);
    setQuizHistory(updated);
    localStorage.setItem('quizHistory', JSON.stringify(updated));
  };

  const handleSetCurrentQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setStartTime(Date.now());
  };

  return (
    <QuizContext.Provider value={{
      currentQuiz,
      currentQuestionIndex,
      userAnswers,
      quizSettings,
      startTime,
      quizHistory,
      setCurrentQuiz: handleSetCurrentQuiz,
      setQuizSettings,
      answerQuestion,
      nextQuestion,
      previousQuestion,
      saveAttempt,
      resetQuiz,
      deleteAttempt,
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