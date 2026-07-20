'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  colorMap: Record<string, string>;
  textMap?: Record<string, string>;
}

export default function StatusBadge({ status, colorMap, textMap }: StatusBadgeProps) {
  const bg = colorMap[status] || '#f3f4f6';
  const label = textMap?.[status] || status;

  return (
    <span
      style={{
        padding: '0.2rem 0.65rem',
        borderRadius: 8,
        fontSize: '0.78rem',
        fontWeight: 500,
        background: bg,
        color: '#374151',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
