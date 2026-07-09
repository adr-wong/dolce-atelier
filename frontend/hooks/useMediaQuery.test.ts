import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import {
  useMediaQuery,
  useMobile,
  useTablet,
  useDesktop,
} from '@/hooks/useMediaQuery';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// --- tiny renderHook harness (jsdom + react-dom, no testing-library needed) ---
function renderHook<T>(callback: () => T) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let value!: T;
  let root!: Root;
  const TestComponent = () => {
    value = callback();
    return null;
  };
  act(() => {
    root = createRoot(container);
    root.render(createElement(TestComponent));
  });
  return {
    get current() {
      return value;
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

// --- matchMedia mock ---
class MockMediaQueryList {
  matches: boolean;
  private listeners = new Set<(e: { matches: boolean }) => void>();
  constructor(matches: boolean) {
    this.matches = matches;
  }
  addEventListener(_: string, cb: (e: { matches: boolean }) => void) {
    this.listeners.add(cb);
  }
  removeEventListener(_: string, cb: (e: { matches: boolean }) => void) {
    this.listeners.delete(cb);
  }
  addListener(cb: (e: { matches: boolean }) => void) {
    this.listeners.add(cb);
  }
  removeListener(cb: (e: { matches: boolean }) => void) {
    this.listeners.delete(cb);
  }
  dispatchEvent() {
    return true;
  }
  fire(matches: boolean) {
    this.matches = matches;
    this.listeners.forEach((l) => l({ matches }));
  }
}

describe('useMediaQuery', () => {
  let mql: MockMediaQueryList;

  beforeEach(() => {
    mql = new MockMediaQueryList(false);
    (window as unknown as { matchMedia: unknown }).matchMedia = jest
      .fn()
      .mockImplementation(() => mql);
  });

  it('returns the current matchMedia.matches value', () => {
    mql.matches = true;
    const { current } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    mql.matches = false;
    const { current } = renderHook(() => useMediaQuery('(min-width: 1025px)'));
    expect(current).toBe(false);
  });

  it('updates when the media query changes', () => {
    mql.matches = false;
    const hook = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(hook.current).toBe(false);

    act(() => {
      mql.fire(true);
    });
    expect(hook.current).toBe(true);
    hook.unmount();
  });

  it('useMobile reflects a mobile viewport', () => {
    mql.matches = true;
    const { current } = renderHook(() => useMobile());
    expect(current).toBe(true);
  });

  it('useTablet reflects a tablet viewport', () => {
    mql.matches = true;
    const { current } = renderHook(() => useTablet());
    expect(current).toBe(true);
  });

  it('useDesktop reflects a desktop viewport', () => {
    mql.matches = false;
    const { current } = renderHook(() => useDesktop());
    expect(current).toBe(false);
  });
});
