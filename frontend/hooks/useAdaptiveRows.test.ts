import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { useAdaptiveRows } from '@/hooks/useAdaptiveRows';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// --- tiny renderHook harness (jsdom + react-dom) ---
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

// ROW_HEIGHT=48, HEADER=52, PAGINATION=52, TITLE=70, LAYOUT_PADDING=64, BORDER=8
// available = innerHeight - (64+70+52+52+8) = innerHeight - 246
const EXPECTED_OVERHEAD = 246;
const ROW_HEIGHT = 48;
const MIN_ROWS = 3;

function expectedRows(innerHeight: number): number {
  const available = innerHeight - EXPECTED_OVERHEAD;
  return Math.max(MIN_ROWS, Math.floor(available / ROW_HEIGHT));
}

describe('useAdaptiveRows', () => {
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    window.innerHeight = originalInnerHeight;
  });

  function setHeight(h: number) {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: h,
    });
  }

  it('starts at a sensible default when viewport is typical', () => {
    setHeight(768);
    const { current } = renderHook(() => useAdaptiveRows());
    expect(current).toBe(expectedRows(768)); // 10
  });

  it('clamps to the minimum when the viewport is very short', () => {
    setHeight(300); // available=54 -> floor=1 -> clamped to 3
    const { current } = renderHook(() => useAdaptiveRows());
    expect(current).toBe(3);
  });

  it('computes more rows for a tall viewport', () => {
    setHeight(1000); // available=754 -> floor=15
    const { current } = renderHook(() => useAdaptiveRows());
    expect(current).toBe(expectedRows(1000)); // 15
  });

  it('recomputes on window resize', () => {
    setHeight(600); // available=354 -> floor=7
    const hook = renderHook(() => useAdaptiveRows());
    expect(hook.current).toBe(7);

    setHeight(900); // available=654 -> floor=13
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(hook.current).toBe(13);
    hook.unmount();
  });
});
