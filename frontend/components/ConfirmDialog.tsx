'use client';

import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmColors: Record<string, string> = {
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '1.5rem',
          width: '90vw',
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>{title}</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: confirmColors[variant] || confirmColors.danger,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
