'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/get-api-url';
import styles from './recetas.module.css';

interface RecetaFormData {
  nota: string;
  personas: number;
}

export default function RecetaForm() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecetaFormData>({
    nota: '',
    personas: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nota || formData.nota.trim() === '') {
      toast.error('Por favor describe tu receta personalizada');
      return;
    }
    
    if (formData.personas < 1) {
      toast.error('El número de personas debe ser al menos 1');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Debes iniciar sesión para enviar una receta');
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/api/recetas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nota: formData.nota,
          personas: formData.personas,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la receta');
      }
      
      toast.success('Receta enviada exitosamente. Recibirás una cotización pronto.');
      setFormData({ nota: '', personas: 10 });
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="nota">
          Describe tu receta personalizada
        </label>
        <textarea
          id="nota"
          value={formData.nota}
          onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
          placeholder="Ej: Quiero un pastel de chocolate con fresas, decorado con buttercream de vainilla y el nombre 'Feliz Cumpleaños María'..."
          className={styles.textarea}
          rows={5}
          required
        />
      </div>
      
      <div className={styles.field}>
        <label className={styles.label} htmlFor="personas">
          Número de personas
        </label>
        <input
          id="personas"
          type="number"
          min="1"
          max="200"
          value={formData.personas}
          onChange={(e) => setFormData({ ...formData, personas: parseInt(e.target.value) || 10 })}
          className={styles.input}
          required
        />
      </div>
      
      <button 
        type="submit" 
        className={styles.submitBtn}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar Receta'}
      </button>
    </form>
  );
}
