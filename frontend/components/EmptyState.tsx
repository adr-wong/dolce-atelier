'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#1a1a1a' }}>{title}</h3>
      {description && <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
