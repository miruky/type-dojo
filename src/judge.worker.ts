// 型検査はTypeScriptコンパイラを丸ごと動かすため、UIスレッドから隔離する
import { judge } from './lib/judge';

export interface JudgeRequest {
  requestId: number;
  solution: string;
  tests: string;
}

self.addEventListener('message', (event: MessageEvent<JudgeRequest>) => {
  const { requestId, solution, tests } = event.data;
  const result = judge(solution, tests);
  self.postMessage({ requestId, ...result });
});
