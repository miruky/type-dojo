import type { Challenge } from './types';

export const advancedChallenges: Challenge[] = [
  {
    id: 'trim',
    title: 'Trim<S>',
    difficulty: '上級',
    summary: '文字列リテラル型の両端の空白を除く',
    description:
      '文字列リテラル型Sの先頭と末尾にある空白(半角スペース・改行・タブ)をすべて取り除いた型を作ります。',
    starter: `type Trim<S extends string> = any;`,
    tests: `type Cases = [
  Expect<Equal<Trim<'str'>, 'str'>>,
  Expect<Equal<Trim<'  str'>, 'str'>>,
  Expect<Equal<Trim<'str  '>, 'str'>>,
  Expect<Equal<Trim<'  str  '>, 'str'>>,
  Expect<Equal<Trim<' \\n\\t str \\t\\n '>, 'str'>>,
];`,
    hint: '先頭一致と末尾一致の2つのパターンを条件型で順に試し、どちらかが一致する間は再帰します。',
    solution: `type Space = ' ' | '\\n' | '\\t';
type Trim<S extends string> = S extends \`\${Space}\${infer R}\`
  ? Trim<R>
  : S extends \`\${infer L}\${Space}\`
    ? Trim<L>
    : S;`,
  },
  {
    id: 'last-of-array',
    title: 'Last<T>',
    difficulty: '上級',
    summary: 'タプルの末尾要素の型を取り出す',
    description: 'タプルTの末尾要素の型を返します。空のタプルにはneverを返してください。',
    starter: `type Last<T extends unknown[]> = any;`,
    tests: `type Cases = [
  Expect<Equal<Last<[3, 2, 1]>, 1>>,
  Expect<Equal<Last<['a', 'b', 'c']>, 'c'>>,
  Expect<Equal<Last<[]>, never>>,
];`,
    hint: '可変長タプルのスプレッドは先頭側にも置けます。[...unknown[], infer L] のパターンです。',
    solution: `type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;`,
  },
  {
    id: 'deep-readonly',
    title: 'DeepReadonly<T>',
    difficulty: '上級',
    summary: '入れ子のオブジェクトを再帰的にreadonlyにする',
    description:
      'オブジェクトTのプロパティを、入れ子の深さに関係なくすべてreadonlyにします。関数プロパティはそのまま保ち、プリミティブはそのまま返してください。',
    starter: `type DeepReadonly<T> = any;`,
    tests: `type Input = {
  a: {
    b: string;
    c: {
      d: boolean;
    };
  };
  e: number;
};

type Expected = {
  readonly a: {
    readonly b: string;
    readonly c: {
      readonly d: boolean;
    };
  };
  readonly e: number;
};

type Cases = [
  Expect<Equal<DeepReadonly<Input>, Expected>>,
  Expect<Equal<DeepReadonly<{ fn: () => void }>, { readonly fn: () => void }>>,
  Expect<Equal<DeepReadonly<string>, string>>,
];`,
    hint: '関数かどうか、オブジェクトかどうかを条件型で順に見分け、オブジェクトならマップ型の値側で自分自身を再帰します。',
    solution: `type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;`,
  },
  {
    id: 'includes',
    title: 'Includes<T, U>',
    difficulty: '上級',
    summary: 'タプルに要素が含まれるかを真に判定する',
    description:
      'タプルTにUと「完全に同じ型」が含まれるかをtrue / falseで返します。U extends T[number] では[boolean]にtrueが含まれると誤判定するため、前置ヘルパーのEqualを実装に使って1要素ずつ比べてください。',
    starter: `type Includes<T extends readonly unknown[], U> = any;`,
    tests: `type Cases = [
  Expect<Equal<Includes<[1, 2, 3], 2>, true>>,
  Expect<Equal<Includes<[1, 2, 3], 4>, false>>,
  Expect<Equal<Includes<[boolean], true>, false>>,
  Expect<Equal<Includes<[], 1>, false>>,
];`,
    hint: '[infer F, ...infer R] で先頭を取り出し、Equal<F, U> がtrueなら確定、そうでなければ残りで再帰します。',
    solution: `type Includes<T extends readonly unknown[], U> = T extends [infer F, ...infer R]
  ? Equal<F, U> extends true
    ? true
    : Includes<R, U>
  : false;`,
  },
  {
    id: 'replace',
    title: 'Replace<S, From, To>',
    difficulty: '上級',
    summary: '文字列リテラル型の最初の一致を置き換える',
    description:
      '文字列リテラル型Sの中で最初に現れたFromをToに置き換えた型を作ります。Fromが空文字のときは置換せずSをそのまま返してください(空文字はどこにでも一致してしまうため)。',
    starter: `type Replace<S extends string, From extends string, To extends string> = any;`,
    tests: `type Cases = [
  Expect<Equal<Replace<'types are fun!', 'fun', 'great'>, 'types are great!'>>,
  Expect<Equal<Replace<'foobarbar', 'bar', 'foo'>, 'foofoobar'>>,
  Expect<Equal<Replace<'foobar', '', 'xyz'>, 'foobar'>>,
  Expect<Equal<Replace<'no match', 'zzz', 'q'>, 'no match'>>,
];`,
    hint: 'まずFromが空文字なら何もしません。テンプレートリテラル型 `${infer A}${From}${infer B}` で前後を取り出し、`${A}${To}${B}` を組み立てます。',
    solution: `type Replace<S extends string, From extends string, To extends string> = From extends ''
  ? S
  : S extends \`\${infer A}\${From}\${infer B}\`
    ? \`\${A}\${To}\${B}\`
    : S;`,
  },
  {
    id: 'string-length',
    title: 'StringLength<S>',
    difficulty: '上級',
    summary: '文字列リテラル型の長さを数える',
    description:
      '文字列リテラル型Sの長さを数値リテラル型で返します。文字列型のlengthはnumberにしかならないため、1文字ずつタプルに積み替えて数えます。',
    starter: `type StringLength<S extends string> = any;`,
    tests: `type Cases = [
  Expect<Equal<StringLength<''>, 0>>,
  Expect<Equal<StringLength<'kitsune'>, 7>>,
  Expect<Equal<StringLength<'type dojo'>, 9>>,
];`,
    hint: 'デフォルト型引数でアキュムレータのタプルを持ち、1文字進むたびに要素を足して、最後にlengthを返します。',
    solution: `type StringLength<S extends string, Acc extends unknown[] = []> = S extends \`\${infer F}\${infer R}\`
  ? StringLength<R, [...Acc, F]>
  : Acc['length'];`,
  },
];
