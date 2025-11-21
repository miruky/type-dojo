// 型レベルパズルの判定器。TypeScriptのLanguageServiceを仮想ファイルの上で動かし、
// 「前置ヘルパー + 解答 + テスト」を1ファイルに連結して型エラーの有無を見る。
// libファイルはバンドルに同梱し、ブラウザでもNodeでも同じ経路で動く。

import ts from 'typescript';
import { PRELUDE } from './prelude';

export { PRELUDE } from './prelude';

export type Section = 'solution' | 'tests';

export interface JudgeDiagnostic {
  section: Section;
  line: number;
  message: string;
}

export interface JudgeResult {
  ok: boolean;
  diagnostics: JudgeDiagnostic[];
  elapsedMs: number;
}

const LIB_DIR = '/libs/';
const MAIN_FILE = '/main.ts';
const DEFAULT_LIB = 'lib.es2020.d.ts';

// 同梱するlib(ES系とdecoratorsのみ。DOMは型パズルに不要なので外して容量を抑える)
const rawLibs = import.meta.glob<string>(
  [
    '/node_modules/typescript/lib/lib.es*.d.ts',
    '/node_modules/typescript/lib/lib.decorators*.d.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
);

const libs = new Map<string, string>();
for (const [path, text] of Object.entries(rawLibs)) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  libs.set(LIB_DIR + name, text);
}

const compilerOptions: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2020,
  lib: [DEFAULT_LIB],
  // テストの型エイリアスは参照されないため、未使用検査は判定の邪魔になる
  noUnusedLocals: false,
  noUnusedParameters: false,
  skipLibCheck: true,
  noEmit: true,
};

let mainText = '';
let mainVersion = 0;

const host: ts.LanguageServiceHost = {
  getCompilationSettings: () => compilerOptions,
  getScriptFileNames: () => [MAIN_FILE],
  getScriptVersion: (fileName) => (fileName === MAIN_FILE ? String(mainVersion) : '1'),
  getScriptSnapshot: (fileName) => {
    const text = fileName === MAIN_FILE ? mainText : libs.get(fileName);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getDefaultLibFileName: () => LIB_DIR + DEFAULT_LIB,
  fileExists: (fileName) => fileName === MAIN_FILE || libs.has(fileName),
  readFile: (fileName) => (fileName === MAIN_FILE ? mainText : libs.get(fileName)),
  getCurrentDirectory: () => '/',
  getNewLine: () => '\n',
  useCaseSensitiveFileNames: () => true,
};

// libのパースを使い回すため、サービスはモジュール内で1つだけ保持する
const service = ts.createLanguageService(host, ts.createDocumentRegistry(true, '/'));

function countLines(text: string): number {
  return text.split('\n').length;
}

export function judge(solution: string, tests: string): JudgeResult {
  const started = Date.now();
  mainText = `${PRELUDE}\n${solution}\n${tests}`;
  mainVersion++;

  // X + '\n' + Y の連結では、Yの開始行(0始まり)は X の split('\n') の要素数に一致する
  const solutionStart = countLines(PRELUDE);
  const testsStart = solutionStart + countLines(solution);
  const program = service.getProgram();
  const source = program?.getSourceFile(MAIN_FILE);
  const all = [
    ...service.getSyntacticDiagnostics(MAIN_FILE),
    ...service.getSemanticDiagnostics(MAIN_FILE),
  ];

  const diagnostics: JudgeDiagnostic[] = all.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (diagnostic.start === undefined || !source) {
      return { section: 'tests', line: 0, message };
    }
    const { line } = ts.getLineAndCharacterOfPosition(source, diagnostic.start);
    if (line < solutionStart) {
      // 前置ヘルパーと衝突する宣言などはユーザーコード起因として扱う
      return { section: 'solution', line: 1, message };
    }
    if (line < testsStart) {
      return { section: 'solution', line: line - solutionStart + 1, message };
    }
    return { section: 'tests', line: line - testsStart + 1, message };
  });

  return { ok: diagnostics.length === 0, diagnostics, elapsedMs: Date.now() - started };
}
