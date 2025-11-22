import { advancedChallenges } from './advanced';
import { basicChallenges } from './basic';
import { intermediateChallenges } from './intermediate';
import type { Challenge, Difficulty } from './types';

export type { Challenge, Difficulty } from './types';

export const challenges: Challenge[] = [
  ...basicChallenges,
  ...intermediateChallenges,
  ...advancedChallenges,
];

export const DIFFICULTIES: Difficulty[] = ['初級', '中級', '上級'];

export function challengeById(id: string): Challenge | undefined {
  return challenges.find((challenge) => challenge.id === id);
}
