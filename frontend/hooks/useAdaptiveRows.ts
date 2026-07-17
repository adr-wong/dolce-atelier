'use client';

import { useState, useEffect } from 'react';

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 52;
const PAGINATION_HEIGHT = 52;
const TITLE_HEIGHT = 70;
const LAYOUT_PADDING = 64;
const BORDER_PADDING = 8;

export function useAdaptiveRows(): number {
  const [rows, setRows] = useState(() => {
    if (typeof window === 'undefined') return 12;
    const available = window.innerHeight
      - LAYOUT_PADDING
      - TITLE_HEIGHT
      - HEADER_HEIGHT
      - PAGINATION_HEIGHT
      - BORDER_PADDING;
    return Math.max(3, Math.floor(available / ROW_HEIGHT));
  });

  useEffect(() => {
    function calc() {
      const available = window.innerHeight
        - LAYOUT_PADDING
        - TITLE_HEIGHT
        - HEADER_HEIGHT
        - PAGINATION_HEIGHT
        - BORDER_PADDING;
      const n = Math.max(3, Math.floor(available / ROW_HEIGHT));
      setRows(n);
    }

    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return rows;
}
