export type Difficulty = '初級' | '中級' | '上級';

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  summary: string;
  description: string;
  starter: string;
  tests: string;
  hint: string;
  solution: string;
}
