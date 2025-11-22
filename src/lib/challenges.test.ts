import { describe, expect, it } from 'vitest';
import { challengeById, challenges, DIFFICULTIES } from './challenges';
import { judge } from './judge';

describe('出題データの整合性', () => {
  it('idは一意である', () => {
    const ids = challenges.map((challenge) => challenge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全フィールドが埋まっている', () => {
    for (const challenge of challenges) {
      expect(challenge.id).toMatch(/^[a-z0-9-]+$/);
      expect(challenge.title.length).toBeGreaterThan(0);
      expect(DIFFICULTIES).toContain(challenge.difficulty);
      expect(challenge.summary.length).toBeGreaterThan(0);
      expect(challenge.description.length).toBeGreaterThan(0);
      expect(challenge.starter.length).toBeGreaterThan(0);
      expect(challenge.tests).toContain('Expect');
      expect(challenge.hint.length).toBeGreaterThan(0);
      expect(challenge.solution.length).toBeGreaterThan(0);
    }
  });

  it('challengeByIdで引ける', () => {
    expect(challengeById('my-pick')?.title).toBe('MyPick<T, K>');
    expect(challengeById('unknown-id')).toBeUndefined();
  });

  it('各難易度に問題がある', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(challenges.some((challenge) => challenge.difficulty === difficulty)).toBe(true);
    }
  });
});

// 出題の品質保証: 公式解はテストに合格し、雛形のままでは不合格になる。
// これが崩れた問題は出題として成立していない。
describe.each(challenges.map((challenge) => [challenge.id, challenge] as const))(
  '出題 %s',
  (_id, challenge) => {
    it('公式解はテストに合格する', () => {
      const result = judge(challenge.solution, challenge.tests);
      expect(result.diagnostics).toEqual([]);
      expect(result.ok).toBe(true);
    });

    it('雛形のままでは不合格になる', () => {
      const result = judge(challenge.starter, challenge.tests);
      expect(result.ok).toBe(false);
    });
  },
);
