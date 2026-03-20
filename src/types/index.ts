export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: 'multiple' | 'truefalse';
}

export interface Quiz {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
  category: string;
  questionType: 'multiple' | 'truefalse' | 'mixed';
}

export interface QuizAttempt {
  id: string;
  topic: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  score: number;
  totalQuestions: number;
  timeTaken: number;
  date: string;
  answers: UserAnswer[];
  questions: Question[];
  hintsUsed: number;
}

export interface UserAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface QuizSettings {
  topic: string;
  category: string;
  numberOfQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timerEnabled: boolean;
  timeLimitSeconds: number;
  questionType: 'multiple' | 'truefalse' | 'mixed';
}