'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './cotizar-modal.module.css';

interface CotizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cotizacion: number) => void;
  recetaId: string;
  recetaNota: string;
}

export default function CotizarModal({ isOpen, onClose, onConfirm, recetaId, recetaNota }: CotizarModalProps) {
  const [cotizacion, setCotizacion] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) {
      setCotizacion('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(cotizacion);
    if (isNaN(value) || value <= 0) return;

    setLoading(true);
    onConfirm(value);
    setLoading(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Cotizar Receta</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <p className={styles.label}>Receta:</p>
          <p className={styles.nota}>{recetaNota.substring(0, 100)}...</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.inputLabel}>Precio (USD):</label>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0.01"
              className={styles.input}
              value={cotizacion}
              onChange={(e) => setCotizacion(e.target.value)}
              placeholder="Ej: 45.00"
              disabled={loading}
            />
            <div className={styles.actions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.confirmBtn}
                disabled={loading || !cotizacion}
              >
                {loading ? 'Guardando...' : 'Guardar Cotización'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
