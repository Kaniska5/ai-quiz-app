import { QuizAttempt } from '@/types';

export function saveQuizHistory(attempts: QuizAttempt[]): void {
  localStorage.setItem('quizHistory', JSON.stringify(attempts));
}

export function loadQuizHistory(): QuizAttempt[] {
  const saved = localStorage.getItem('quizHistory');
  return saved ? JSON.parse(saved) : [];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function calculateScore(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}