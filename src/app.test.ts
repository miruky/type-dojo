// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './app';
import { challenges } from './lib/challenges';
import { store } from './lib/storage';

function mount(): HTMLElement {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById('app') as HTMLElement;
  mountApp(root);
  return root;
}

function editorOf(root: HTMLElement): HTMLTextAreaElement {
  return root.querySelector('#editor') as HTMLTextAreaElement;
}

function clickAction(root: HTMLElement, action: string): void {
  (root.querySelector(`button[data-act="${action}"]`) as HTMLButtonElement).click();
}

beforeEach(() => {
  store.clear();
});

describe('mountApp', () => {
  it('全問題が難易度別に一覧され、最初の問題が開かれる', () => {
    const root = mount();
    expect(root.querySelectorAll('.challenge-list button[data-id]').length).toBe(challenges.length);
    const first = challenges[0];
    expect(root.querySelector('.challenge-title')?.textContent).toBe(first?.title);
    expect(editorOf(root).value).toBe(first?.starter);
    expect(root.querySelector('.progress-label')?.textContent).toBe(
      `クリア 0 / ${challenges.length}`,
    );
  });

  it('問題を選ぶと内容と雛形が切り替わる', () => {
    const root = mount();
    const target = challenges[3] as (typeof challenges)[number];
    (
      root.querySelector(`.challenge-list button[data-id="${target.id}"]`) as HTMLButtonElement
    ).click();
    expect(root.querySelector('.challenge-title')?.textContent).toBe(target.title);
    expect(editorOf(root).value).toBe(target.starter);
    expect(
      root
        .querySelector(`.challenge-list button[data-id="${target.id}"]`)
        ?.getAttribute('aria-current'),
    ).toBe('true');
  });

  it('編集途中の解答は問題を行き来しても保持される', () => {
    const root = mount();
    const editor = editorOf(root);
    editor.value = 'type MyPick<T, K> = unknown;';
    editor.dispatchEvent(new Event('input'));
    const other = challenges[1] as (typeof challenges)[number];
    (
      root.querySelector(`.challenge-list button[data-id="${other.id}"]`) as HTMLButtonElement
    ).click();
    const first = challenges[0] as (typeof challenges)[number];
    (
      root.querySelector(`.challenge-list button[data-id="${first.id}"]`) as HTMLButtonElement
    ).click();
    expect(editorOf(root).value).toBe('type MyPick<T, K> = unknown;');
  });

  it('リセットで雛形に戻る', () => {
    const root = mount();
    const editor = editorOf(root);
    editor.value = 'type Broken = ;';
    editor.dispatchEvent(new Event('input'));
    clickAction(root, 'reset');
    expect(editor.value).toBe(challenges[0]?.starter);
  });

  it('ヒントと解答例を表示できる', () => {
    const root = mount();
    const hintBox = root.querySelector('.hint-box') as HTMLElement;
    expect(hintBox.hidden).toBe(true);
    clickAction(root, 'hint');
    expect(hintBox.hidden).toBe(false);
    expect(hintBox.textContent).toContain(challenges[0]?.hint);
    clickAction(root, 'solution');
    expect(hintBox.textContent).toContain('解答例');
  });
});

describe('判定フロー', () => {
  it('正しい解答で合格になり、進捗が保存される', async () => {
    const root = mount();
    const first = challenges[0] as (typeof challenges)[number];
    const editor = editorOf(root);
    editor.value = first.solution;
    editor.dispatchEvent(new Event('input'));
    clickAction(root, 'run');
    await vi.waitFor(
      () => {
        expect(root.querySelector('.verdict.pass')).not.toBeNull();
      },
      { timeout: 20000 },
    );
    expect(root.querySelector('.progress-label')?.textContent).toBe(
      `クリア 1 / ${challenges.length}`,
    );
    expect(
      root.querySelector(`.challenge-list button[data-id="${first.id}"] .item-mark`),
    ).not.toBeNull();
    expect(JSON.parse(store.getItem('type-dojo:cleared') ?? '{}')).toHaveProperty(first.id);
  }, 30000);

  it('雛形のままでは不合格になり、診断が表示される', async () => {
    const root = mount();
    clickAction(root, 'run');
    await vi.waitFor(
      () => {
        expect(root.querySelector('.verdict.fail')).not.toBeNull();
      },
      { timeout: 20000 },
    );
    expect(root.querySelectorAll('.verdict li').length).toBeGreaterThan(0);
  }, 30000);

  it('進捗を消去できる', async () => {
    store.setItem('type-dojo:cleared', JSON.stringify({ 'my-pick': 'x' }));
    const root = mount();
    expect(root.querySelector('.progress-label')?.textContent).toBe(
      `クリア 1 / ${challenges.length}`,
    );
    clickAction(root, 'clear-progress');
    expect(root.querySelector('.progress-label')?.textContent).toBe(
      `クリア 0 / ${challenges.length}`,
    );
  });
});
