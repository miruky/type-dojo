import type { Challenge } from './types';

export const basicChallenges: Challenge[] = [
  {
    id: 'my-pick',
    title: 'MyPick<T, K>',
    difficulty: '初級',
    summary: '組み込みのPickを自作する',
    description:
      'Tのプロパティのうち、Kで指定したキーだけを残したオブジェクト型を作ります。Tに存在しないキーを渡したときはコンパイルエラーになる必要があります。',
    starter: `type MyPick<T, K> = any;`,
    tests: `interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type Cases = [
  Expect<Equal<MyPick<Todo, 'title'>, { title: string }>>,
  Expect<Equal<MyPick<Todo, 'title' | 'completed'>, { title: string; completed: boolean }>>,
];

// @ts-expect-error 存在しないキーは拒否される
type Invalid = MyPick<Todo, 'invalid'>;`,
    hint: 'K extends keyof T で受け取れるキーを制約し、マップ型 { [P in K]: T[P] } で写し取ります。',
    solution: `type MyPick<T, K extends keyof T> = { [P in K]: T[P] };`,
  },
  {
    id: 'my-readonly',
    title: 'MyReadonly<T>',
    difficulty: '初級',
    summary: '全プロパティをreadonlyにする',
    description:
      'Tのすべてのプロパティをreadonlyにした型を作ります。組み込みのReadonlyは使わずに書いてください。',
    starter: `type MyReadonly<T> = any;`,
    tests: `interface Todo {
  title: string;
  description: string;
}

type Cases = [
  Expect<Equal<MyReadonly<Todo>, { readonly title: string; readonly description: string }>>,
  Expect<NotEqual<MyReadonly<Todo>, Todo>>,
];`,
    hint: 'マップ型のキー部分に readonly 修飾子を前置できます。',
    solution: `type MyReadonly<T> = { readonly [P in keyof T]: T[P] };`,
  },
  {
    id: 'first-of-array',
    title: 'First<T>',
    difficulty: '初級',
    summary: 'タプルの先頭要素の型を取り出す',
    description:
      'タプルTの先頭要素の型を返します。空のタプルにはneverを返してください。T[0]と書くだけでは空タプルでエラーになります。',
    starter: `type First<T extends unknown[]> = any;`,
    tests: `type Cases = [
  Expect<Equal<First<[3, 2, 1]>, 3>>,
  Expect<Equal<First<['a', 'b']>, 'a'>>,
  Expect<Equal<First<[undefined]>, undefined>>,
  Expect<Equal<First<[]>, never>>,
];`,
    hint: '条件型と infer を使い、[infer F, ...unknown[]] のパターンに一致するかで分岐します。',
    solution: `type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;`,
  },
  {
    id: 'tuple-length',
    title: 'Length<T>',
    difficulty: '初級',
    summary: 'タプルの長さを数値リテラル型で返す',
    description:
      'タプルTの長さを数値リテラル型として返します。タプル以外(stringなど)を渡したときはコンパイルエラーになる必要があります。',
    starter: `type Length<T> = any;`,
    tests: `type Tesla = ['tesla', 'model 3', 'model X', 'model Y'];

type Cases = [
  Expect<Equal<Length<Tesla>, 4>>,
  Expect<Equal<Length<[]>, 0>>,
];

// @ts-expect-error タプル以外は受け付けない
type Invalid = Length<string>;`,
    hint: 'タプル型の length プロパティは数値リテラル型になっています。型引数に readonly unknown[] の制約を付けます。',
    solution: `type Length<T extends readonly unknown[]> = T['length'];`,
  },
  {
    id: 'my-exclude',
    title: 'MyExclude<T, U>',
    difficulty: '初級',
    summary: 'ユニオン型から特定のメンバーを除く',
    description:
      'ユニオン型TからUに代入できるメンバーを取り除いた型を作ります。組み込みのExcludeと同じ動きです。',
    starter: `type MyExclude<T, U> = any;`,
    tests: `type Cases = [
  Expect<Equal<MyExclude<'a' | 'b' | 'c', 'a'>, 'b' | 'c'>>,
  Expect<Equal<MyExclude<'a' | 'b' | 'c', 'a' | 'b'>, 'c'>>,
  Expect<Equal<MyExclude<string | number | boolean, boolean>, string | number>>,
];`,
    hint: '条件型はユニオンの各メンバーに分配されます。除きたいものに never を返します。',
    solution: `type MyExclude<T, U> = T extends U ? never : T;`,
  },
  {
    id: 'if-type',
    title: 'If<C, T, F>',
    difficulty: '初級',
    summary: '型レベルの条件分岐を作る',
    description:
      'Cがtrueのとき T、falseのとき F になる型を作ります。Cにはboolean型のリテラルしか渡せないように制約してください。',
    starter: `type If<C, T, F> = any;`,
    tests: `type Cases = [
  Expect<Equal<If<true, 'a', 'b'>, 'a'>>,
  Expect<Equal<If<false, 'a', 2>, 2>>,
];

// @ts-expect-error boolean以外の条件は受け付けない
type Invalid = If<null, 'a', 'b'>;`,
    hint: 'C extends boolean の制約を付けたうえで、C extends true で分岐します。',
    solution: `type If<C extends boolean, T, F> = C extends true ? T : F;`,
  },
];
