export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  score: number;
  totalQuestions: number;
  timeTaken: number;
  date: string;
  answers: UserAnswer[];
  questions: Question[];
}

export interface UserAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface QuizSettings {
  topic: string;
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timerEnabled: boolean;
  timeLimitSeconds: number;
}