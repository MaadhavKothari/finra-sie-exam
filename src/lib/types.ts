export interface Choice {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  explanation: string;
}

export interface Question {
  id: string;
  stem: string;
  choices: [Choice, Choice, Choice, Choice];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  regulatoryBasis?: string;
  lastVerified?: string;
}

export interface QuizResult {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correct: boolean;
  timeSpent: number; // ms
}

export interface QuizSession {
  id: string;
  topic: string | 'all';
  startedAt: number;
  completedAt?: number;
  results: QuizResult[];
  totalQuestions: number;
}

export interface UserProgress {
  totalAnswered: number;
  totalCorrect: number;
  streak: number;
  bestStreak: number;
  xp: number;
  level: number;
  sessions: QuizSession[];
  lastStudied: string | null; // ISO date
  dailyGoal: number;
  dailyAnswered: number;
  dailyDate: string | null;
}
