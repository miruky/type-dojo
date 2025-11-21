import { describe, expect, it } from 'vitest';
import { judge, PRELUDE } from './judge';

describe('judge 基本動作', () => {
  it('空の解答と空のテストはエラーなしで通る', () => {
    const result = judge('', '');
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('正しい解答はテストに合格する', () => {
    const result = judge(
      `type MyPick<T, K extends keyof T> = { [P in K]: T[P] };`,
      `interface Todo { title: string; done: boolean }
type Cases = [Expect<Equal<MyPick<Todo, 'title'>, { title: string }>>];`,
    );
    expect(result.ok).toBe(true);
  });

  it('プレースホルダのanyはEqualで弾かれて不合格になる', () => {
    const result = judge(
      `type MyPick<T, K> = any;`,
      `interface Todo { title: string }
type Cases = [Expect<Equal<MyPick<Todo, 'title'>, { title: string }>>];`,
    );
    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('同じ判定器を連続で使っても結果が独立している', () => {
    const bad = judge(`type X = string;`, `type Cases = [Expect<Equal<X, number>>];`);
    const good = judge(`type X = number;`, `type Cases = [Expect<Equal<X, number>>];`);
    expect(bad.ok).toBe(false);
    expect(good.ok).toBe(true);
  });
});

describe('judge 診断の位置づけ', () => {
  it('解答内の構文エラーはsolutionセクションの正しい行を指す', () => {
    const result = judge(`type A = string;\ntype B = ;`, `type Cases = [];`);
    expect(result.ok).toBe(false);
    const diagnostic = result.diagnostics[0];
    expect(diagnostic?.section).toBe('solution');
    expect(diagnostic?.line).toBe(2);
  });

  it('テスト側の不一致はtestsセクションを指す', () => {
    const result = judge(`type Id<T> = T;`, `type Cases = [\n  Expect<Equal<Id<1>, 2>>,\n];`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.every((d) => d.section === 'tests')).toBe(true);
    expect(result.diagnostics[0]?.line).toBe(2);
  });

  it('過剰に緩い解答は@ts-expect-errorの未使用として検出される', () => {
    const tests = `interface Todo { title: string }
// @ts-expect-error 存在しないキーは拒否される
type Invalid = Loose<Todo, 'invalid'>;`;
    const loose = judge(`type Loose<T, K> = { [P in keyof T]: T[P] };`, tests);
    expect(loose.ok).toBe(false);
    const strict = judge(`type Loose<T, K extends keyof T> = { [P in K]: T[P] };`, tests);
    expect(strict.ok).toBe(true);
  });

  it('前置ヘルパーと衝突する宣言はsolutionセクションとして報告される', () => {
    const result = judge(`type Equal<A, B> = true;`, `type Cases = [];`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((d) => d.section === 'solution')).toBe(true);
  });
});

describe('PRELUDE', () => {
  it('EqualとNotEqualを提供する', () => {
    expect(PRELUDE).toContain('type Expect<T extends true>');
    expect(PRELUDE).toContain('type Equal<X, Y>');
    expect(PRELUDE).toContain('type NotEqual<X, Y>');
  });

  it('Equalはanyと具体型を区別する', () => {
    const result = judge('', `type Cases = [Expect<Equal<any, string>>];`);
    expect(result.ok).toBe(false);
  });

  it('Equalはreadonly修飾の有無を区別する', () => {
    const result = judge('', `type Cases = [Expect<Equal<{ a: 1 }, { readonly a: 1 }>>];`);
    expect(result.ok).toBe(false);
  });
});
