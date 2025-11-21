// 判定対象の先頭に常に連結されるヘルパー型。判定器とUIの双方から参照されるが、
// UI側がコンパイラ本体(judge.ts)を静的に抱え込まないよう独立させている。

// Equal はいわゆる「真の型一致」判定。条件型の同一性比較に乗せることで
// any や readonly の差も見分ける。解答側からも使える。
export const PRELUDE = `type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type NotEqual<X, Y> = Equal<X, Y> extends true ? false : true;
`;
