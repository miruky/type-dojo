import type { Challenge } from './types';

export const intermediateChallenges: Challenge[] = [
  {
    id: 'concat',
    title: 'Concat<A, B>',
    difficulty: '中級',
    summary: '2つのタプルを型レベルで連結する',
    description:
      'JavaScriptのArray.prototype.concatのように、2つのタプルを順に連結したタプル型を作ります。',
    starter: `type Concat<A extends unknown[], B extends unknown[]> = any;`,
    tests: `type Cases = [
  Expect<Equal<Concat<[], []>, []>>,
  Expect<Equal<Concat<[1], [2]>, [1, 2]>>,
  Expect<Equal<Concat<['1', 2], [false, '4']>, ['1', 2, false, '4']>>,
];`,
    hint: 'タプル型の中でもスプレッド構文 [...A, ...B] が使えます。',
    solution: `type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];`,
  },
  {
    id: 'tuple-to-union',
    title: 'TupleToUnion<T>',
    difficulty: '中級',
    summary: 'タプルの要素型をユニオンにする',
    description: 'タプルTの全要素の型からなるユニオン型を作ります。',
    starter: `type TupleToUnion<T extends readonly unknown[]> = any;`,
    tests: `type Cases = [
  Expect<Equal<TupleToUnion<['1', '2', '3']>, '1' | '2' | '3'>>,
  Expect<Equal<TupleToUnion<[123, true]>, 123 | true>>,
  Expect<Equal<TupleToUnion<[]>, never>>,
];`,
    hint: '配列型を数値でインデックスアクセスすると、全要素のユニオンが得られます。',
    solution: `type TupleToUnion<T extends readonly unknown[]> = T[number];`,
  },
  {
    id: 'tuple-to-object',
    title: 'TupleToObject<T>',
    difficulty: '中級',
    summary: 'タプルからキーと値が同じオブジェクトを作る',
    description:
      'タプルの各要素をキーかつ値とするオブジェクト型を作ります。オブジェクトのキーになれない要素(配列など)を含むタプルはコンパイルエラーにしてください。',
    starter: `type TupleToObject<T extends readonly PropertyKey[]> = any;`,
    tests: `const tuple = ['tesla', 'model 3'] as const;

type Cases = [
  Expect<Equal<TupleToObject<typeof tuple>, { tesla: 'tesla'; 'model 3': 'model 3' }>>,
  Expect<Equal<TupleToObject<[1, 2]>, { 1: 1; 2: 2 }>>,
];

// @ts-expect-error キーになれない要素は拒否される
type Invalid = TupleToObject<[[1, 2]]>;`,
    hint: 'T[number] でユニオンを取り出し、マップ型のキーとして巡回します。',
    solution: `type TupleToObject<T extends readonly PropertyKey[]> = { [P in T[number]]: P };`,
  },
  {
    id: 'my-return-type',
    title: 'MyReturnType<T>',
    difficulty: '中級',
    summary: '関数型から戻り値の型を取り出す',
    description: '組み込みのReturnTypeを自作します。関数型Tの戻り値の型を返してください。',
    starter: `type MyReturnType<T> = any;`,
    tests: `type Cases = [
  Expect<Equal<MyReturnType<() => string>, string>>,
  Expect<Equal<MyReturnType<(a: number) => 1 | 2>, 1 | 2>>,
  Expect<Equal<MyReturnType<(a: boolean) => Promise<number>>, Promise<number>>>,
];`,
    hint: '条件型の infer を戻り値の位置に置きます。引数は (...args: never[]) で受けると任意の関数型に一致します。',
    solution: `type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;`,
  },
  {
    id: 'my-omit',
    title: 'MyOmit<T, K>',
    difficulty: '中級',
    summary: '組み込みのOmitを自作する',
    description:
      'Tのプロパティのうち、Kで指定したキーを取り除いたオブジェクト型を作ります。Tに存在しないキーを渡したときはコンパイルエラーになる必要があります。',
    starter: `type MyOmit<T, K> = any;`,
    tests: `interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type Cases = [
  Expect<Equal<MyOmit<Todo, 'description'>, { title: string; completed: boolean }>>,
  Expect<Equal<MyOmit<Todo, 'description' | 'completed'>, { title: string }>>,
];

// @ts-expect-error 存在しないキーは拒否される
type Invalid = MyOmit<Todo, 'invalid'>;`,
    hint: 'マップ型のキー再マッピング(as句)で、除きたいキーを never に飛ばします。',
    solution: `type MyOmit<T, K extends keyof T> = { [P in keyof T as P extends K ? never : P]: T[P] };`,
  },
  {
    id: 'push',
    title: 'Push<T, U>',
    difficulty: '中級',
    summary: 'タプルの末尾に要素を追加する',
    description: 'Array.prototype.pushの型版です。タプルTの末尾にUを追加したタプル型を返します。',
    starter: `type Push<T extends unknown[], U> = any;`,
    tests: `type Cases = [
  Expect<Equal<Push<[], 1>, [1]>>,
  Expect<Equal<Push<[1, 2], '3'>, [1, 2, '3']>>,
  Expect<Equal<Push<['a'], [1]>, ['a', [1]]>>,
];`,
    hint: 'スプレッド構文で [...T, U] と書けます。',
    solution: `type Push<T extends unknown[], U> = [...T, U];`,
  },
  {
    id: 'trim-left',
    title: 'TrimLeft<S>',
    difficulty: '中級',
    summary: '文字列リテラル型の先頭の空白を除く',
    description:
      '文字列リテラル型Sの先頭にある空白(半角スペース・改行・タブ)をすべて取り除いた型を作ります。',
    starter: `type TrimLeft<S extends string> = any;`,
    tests: `type Cases = [
  Expect<Equal<TrimLeft<'str'>, 'str'>>,
  Expect<Equal<TrimLeft<'  str'>, 'str'>>,
  Expect<Equal<TrimLeft<'\\n\\t str'>, 'str'>>,
  Expect<Equal<TrimLeft<''>, ''>>,
];`,
    hint: 'テンプレートリテラル型のパターンに空白のユニオンを置き、一致する間は再帰します。',
    solution: `type TrimLeft<S extends string> = S extends \`\${' ' | '\\n' | '\\t'}\${infer R}\`
  ? TrimLeft<R>
  : S;`,
  },
];
