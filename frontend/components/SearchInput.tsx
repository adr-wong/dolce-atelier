'use client';

import React, { useState, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({ value: externalValue, onChange, placeholder = 'Buscar...', debounceMs = 300 }: SearchInputProps) {
  const [local, setLocal] = useState(externalValue);

  useEffect(() => {
    setLocal(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== externalValue) {
        onChange(local);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs, onChange, externalValue]);

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#9ca3af' }}>
        🔍
      </span>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.55rem 0.75rem 0.55rem 2.2rem',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          fontSize: '0.85rem',
          outline: 'none',
          background: '#fff',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#e11d48')}
        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocal('');
            onChange('');
          }
        }}
      />
    </div>
  );
}
