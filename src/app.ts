import { challengeById, challenges, DIFFICULTIES, type Challenge } from './lib/challenges';
import type { JudgeResult } from './lib/judge';
import { PRELUDE } from './lib/prelude';
import { store } from './lib/storage';
import {
  THEME_STORAGE_KEY,
  choiceLabel,
  nextChoice,
  parseChoice,
  resolveTheme,
  type ThemeChoice,
} from './lib/theme';
import type { JudgeRequest } from './judge.worker';

const PROGRESS_KEY = 'type-dojo:cleared';
const DRAFT_PREFIX = 'type-dojo:draft:';

function loadProgress(): Record<string, string> {
  try {
    const raw = store.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, string>): void {
  store.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// 判定はWorkerで行い、Workerが使えない環境(テスト等)では同一スレッドに切り替える
class JudgeClient {
  private worker: Worker | null = null;
  private nextRequestId = 1;
  private readonly pending = new Map<number, (result: JudgeResult) => void>();

  async run(solution: string, tests: string): Promise<JudgeResult> {
    if (typeof Worker === 'undefined') {
      const { judge } = await import('./lib/judge');
      return judge(solution, tests);
    }
    if (!this.worker) {
      this.worker = new Worker(new URL('./judge.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.addEventListener(
        'message',
        (event: MessageEvent<JudgeResult & { requestId: number }>) => {
          const resolve = this.pending.get(event.data.requestId);
          this.pending.delete(event.data.requestId);
          resolve?.(event.data);
        },
      );
    }
    const requestId = this.nextRequestId++;
    const request: JudgeRequest = { requestId, solution, tests };
    return new Promise((resolve) => {
      this.pending.set(requestId, resolve);
      this.worker?.postMessage(request);
    });
  }
}

const LOGO = `
<svg viewBox="0 0 64 64" aria-hidden="true" class="brand-logo">
  <path d="M8 14 H56" class="logo-beam" />
  <path d="M12 24 H52" class="logo-beam-thin" />
  <path d="M17 24 L15 56" class="logo-pillar" />
  <path d="M47 24 L49 56" class="logo-pillar" />
  <path d="M8 14 Q32 8 56 14" class="logo-beam" />
</svg>
`;

const THEME_ICON =
  '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/></svg>';

/** テーマ(自動 / ライト / ダーク)の切替。選択は保存し、自動時はOSに追従する。 */
function setupTheme(root: HTMLElement): void {
  const btn = root.querySelector('#theme-toggle') as HTMLButtonElement | null;
  const labelEl = root.querySelector('#theme-label') as HTMLElement | null;
  if (!btn || !labelEl) return;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let choice: ThemeChoice = parseChoice(store.getItem(THEME_STORAGE_KEY));
  const apply = (): void => {
    document.documentElement.dataset.theme = resolveTheme(choice, media.matches);
    labelEl.textContent = choiceLabel(choice);
    btn.dataset.choice = choice;
    btn.setAttribute('aria-label', `テーマ: ${choiceLabel(choice)}。クリックで切り替え`);
  };
  btn.addEventListener('click', () => {
    choice = nextChoice(choice);
    store.setItem(THEME_STORAGE_KEY, choice);
    apply();
  });
  media.addEventListener('change', () => {
    if (choice === 'system') apply();
  });
  apply();
}

export function mountApp(root: HTMLElement): void {
  const judgeClient = new JudgeClient();
  let progress = loadProgress();
  let current: Challenge = challenges[0] as Challenge;

  root.innerHTML = `
    <div class="shell">
      <header class="masthead">
        ${LOGO}
        <div class="masthead-text">
          <p class="kicker">Type-level Puzzles</p>
          <h1>type-dojo</h1>
          <p class="lede">ブラウザ内のTypeScriptコンパイラが判定する、型レベルプログラミングの演習場</p>
        </div>
        <div class="masthead-aside">
          <button type="button" id="theme-toggle" class="theme-toggle">
            ${THEME_ICON}<span id="theme-label" class="theme-label">自動</span>
          </button>
          <div class="progress" role="status">
            <span class="progress-label"></span>
            <div class="progress-track" role="presentation"><div class="progress-fill"></div></div>
          </div>
        </div>
      </header>
      <div class="layout">
        <nav class="challenge-list" aria-label="問題一覧"></nav>
        <main class="challenge-pane">
          <header class="challenge-head">
            <h2 class="challenge-title"></h2>
            <span class="chip"></span>
            <div class="challenge-nav">
              <button type="button" class="nav-btn" data-act="prev" aria-label="前の問題">‹</button>
              <button type="button" class="nav-btn" data-act="next" aria-label="次の問題">›</button>
            </div>
          </header>
          <p class="challenge-desc"></p>
          <details class="prelude">
            <summary>前置ヘルパー(解答とテストの両方から使えます)</summary>
            <pre><code></code></pre>
          </details>
          <section class="editor-card">
            <label class="editor-label" for="editor">解答(型エイリアスを実装する)</label>
            <textarea id="editor" spellcheck="false" autocomplete="off"></textarea>
            <div class="editor-actions">
              <button type="button" class="primary" data-act="run">判定</button>
              <button type="button" data-act="reset">リセット</button>
              <button type="button" data-act="hint">ヒント</button>
              <button type="button" data-act="solution">解答を見る</button>
              <span class="editor-shortcut">Ctrl+Enterでも判定できます</span>
            </div>
          </section>
          <div class="hint-box" hidden></div>
          <section class="result" aria-live="polite"></section>
          <details class="tests-view">
            <summary>判定に使うテストコード</summary>
            <pre><code></code></pre>
          </details>
        </main>
      </div>
      <footer class="footnote">
        <a href="https://github.com/miruky/type-dojo">GitHub</a>
        <button type="button" class="linklike" data-act="clear-progress">進捗を消去</button>
      </footer>
    </div>
  `;

  const listEl = root.querySelector('.challenge-list') as HTMLElement;
  const titleEl = root.querySelector('.challenge-title') as HTMLElement;
  const chipEl = root.querySelector('.chip') as HTMLElement;
  const descEl = root.querySelector('.challenge-desc') as HTMLElement;
  const preludeCode = root.querySelector('.prelude code') as HTMLElement;
  const editor = root.querySelector('#editor') as HTMLTextAreaElement;
  const hintBox = root.querySelector('.hint-box') as HTMLElement;
  const resultEl = root.querySelector('.result') as HTMLElement;
  const testsCode = root.querySelector('.tests-view code') as HTMLElement;
  const progressLabel = root.querySelector('.progress-label') as HTMLElement;
  const progressFill = root.querySelector('.progress-fill') as HTMLElement;
  const runButton = root.querySelector('button[data-act="run"]') as HTMLButtonElement;
  const prevButton = root.querySelector('button[data-act="prev"]') as HTMLButtonElement;
  const nextButton = root.querySelector('button[data-act="next"]') as HTMLButtonElement;

  preludeCode.textContent = PRELUDE;
  setupTheme(root);

  function renderProgress(): void {
    const cleared = challenges.filter((challenge) => progress[challenge.id]).length;
    progressLabel.textContent = `クリア ${cleared} / ${challenges.length}`;
    progressFill.style.width = `${(cleared / challenges.length) * 100}%`;
  }

  function renderList(): void {
    listEl.replaceChildren(
      ...DIFFICULTIES.map((difficulty) => {
        const group = document.createElement('section');
        const heading = document.createElement('h2');
        heading.textContent = difficulty;
        group.append(heading);
        const list = document.createElement('ul');
        for (const challenge of challenges.filter((c) => c.difficulty === difficulty)) {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.id = challenge.id;
          if (challenge.id === current.id) button.setAttribute('aria-current', 'true');
          const name = document.createElement('span');
          name.className = 'item-title';
          name.textContent = challenge.title;
          const summary = document.createElement('span');
          summary.className = 'item-summary';
          summary.textContent = challenge.summary;
          button.append(name, summary);
          if (progress[challenge.id]) {
            button.classList.add('cleared');
            const mark = document.createElement('span');
            mark.className = 'item-mark';
            mark.setAttribute('aria-label', 'クリア済み');
            mark.innerHTML =
              '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            button.append(mark);
          }
          item.append(button);
          list.append(item);
        }
        group.append(list);
        return group;
      }),
    );
  }

  function select(challenge: Challenge): void {
    current = challenge;
    titleEl.textContent = challenge.title;
    chipEl.textContent = challenge.difficulty;
    chipEl.dataset.level = challenge.difficulty;
    descEl.textContent = challenge.description;
    testsCode.textContent = challenge.tests;
    editor.value = store.getItem(DRAFT_PREFIX + challenge.id) ?? challenge.starter;
    hintBox.hidden = true;
    resultEl.replaceChildren();
    const index = challenges.indexOf(challenge);
    prevButton.disabled = index <= 0;
    nextButton.disabled = index >= challenges.length - 1;
    renderList();
  }

  // 一覧の並び順で前後の問題へ移動する
  function navigate(offset: number): void {
    const next = challenges[challenges.indexOf(current) + offset];
    if (next) select(next);
  }

  function renderResult(result: JudgeResult): void {
    resultEl.replaceChildren();
    const panel = document.createElement('div');
    panel.className = result.ok ? 'verdict pass' : 'verdict fail';
    const heading = document.createElement('p');
    heading.className = 'verdict-title';
    heading.textContent = result.ok
      ? `合格(${result.elapsedMs}msで型検査)`
      : `不合格: 型エラー ${result.diagnostics.length} 件`;
    panel.append(heading);
    if (!result.ok) {
      const list = document.createElement('ul');
      for (const diagnostic of result.diagnostics) {
        const item = document.createElement('li');
        const where = document.createElement('span');
        where.className = 'diag-where';
        where.textContent =
          diagnostic.section === 'solution'
            ? `解答 ${diagnostic.line}行目`
            : `テスト ${diagnostic.line}行目`;
        const message = document.createElement('span');
        message.textContent = diagnostic.message;
        item.append(where, message);
        list.append(item);
      }
      panel.append(list);
    }
    if (result.ok && challenges.indexOf(current) < challenges.length - 1) {
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'verdict-next';
      next.dataset.act = 'next';
      next.textContent = '次の問題へ';
      panel.append(next);
    }
    resultEl.append(panel);
  }

  async function run(): Promise<void> {
    runButton.disabled = true;
    runButton.textContent = '判定中…';
    try {
      const result = await judgeClient.run(editor.value, current.tests);
      renderResult(result);
      if (result.ok && !progress[current.id]) {
        progress[current.id] = new Date().toISOString();
        saveProgress(progress);
        renderProgress();
        renderList();
      }
    } finally {
      runButton.disabled = false;
      runButton.textContent = '判定';
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const listButton = target.closest('.challenge-list button[data-id]');
    if (listButton) {
      const next = challengeById((listButton as HTMLElement).dataset.id ?? '');
      if (next) select(next);
      return;
    }
    const action = (target.closest('button[data-act]') as HTMLElement | null)?.dataset.act;
    if (!action) return;
    if (action === 'run') void run();
    if (action === 'prev') navigate(-1);
    if (action === 'next') navigate(1);
    if (action === 'reset') {
      store.removeItem(DRAFT_PREFIX + current.id);
      editor.value = current.starter;
      resultEl.replaceChildren();
      hintBox.hidden = true;
    }
    if (action === 'hint') {
      hintBox.hidden = !hintBox.hidden;
      if (!hintBox.hidden) {
        hintBox.replaceChildren();
        const label = document.createElement('p');
        label.className = 'hint-label';
        label.textContent = 'ヒント';
        const body = document.createElement('p');
        body.textContent = current.hint;
        hintBox.append(label, body);
      }
    }
    if (action === 'solution') {
      hintBox.hidden = false;
      hintBox.replaceChildren();
      const label = document.createElement('p');
      label.className = 'hint-label';
      label.textContent = '解答例';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = current.solution;
      pre.append(code);
      hintBox.append(label, pre);
    }
    if (action === 'clear-progress') {
      progress = {};
      saveProgress(progress);
      renderProgress();
      renderList();
    }
  });

  editor.addEventListener('input', () => {
    store.setItem(DRAFT_PREFIX + current.id, editor.value);
  });
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void run();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = `${editor.value.slice(0, start)}  ${editor.value.slice(end)}`;
      editor.selectionStart = start + 2;
      editor.selectionEnd = start + 2;
    }
  });

  renderProgress();
  select(current);
}
