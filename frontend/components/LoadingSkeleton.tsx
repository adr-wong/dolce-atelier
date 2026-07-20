'use client';

import React from 'react';

interface LoadingSkeletonProps {
  type?: 'table' | 'cards' | 'detail';
  rows?: number;
}

export default function LoadingSkeleton({ type = 'table', rows = 5 }: LoadingSkeletonProps) {
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 6,
  };

  if (type === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', padding: '1.25rem', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ ...shimmerStyle, width: '60%', height: 14, marginBottom: 8 }} />
            <div style={{ ...shimmerStyle, width: '30%', height: 28 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '1rem', borderBottom: i < rows - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', gap: '1rem' }}>
          <div style={{ ...shimmerStyle, flex: 2, height: 16 }} />
          <div style={{ ...shimmerStyle, flex: 1, height: 16 }} />
          <div style={{ ...shimmerStyle, flex: 1, height: 16 }} />
          <div style={{ ...shimmerStyle, flex: 1, height: 16 }} />
        </div>
      ))}
    </div>
  );
}
