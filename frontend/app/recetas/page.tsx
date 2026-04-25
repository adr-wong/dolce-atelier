'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecetasPage() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nota, setNota] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    alert('Funcionalidad pendiente de conectar con backend');
    setCargando(false);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Solicitar Pastel Personalizado</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Sube tu receta o describe tuidea y nos pondremos en contacto contigo con la cotización.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Archivo de Receta (opcional)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            PDF, JPG o PNG (máx. 5MB)
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Descripción del Pastel
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Describe ingredientes, diseño, decoración, alergias..."
            required
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Cantidad de Personas
          </label>
          <select style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            {[5, 10, 15, 20, 30, 50].map(n => (
              <option key={n} value={n}>{n} personas</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '1rem',
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
            opacity: cargando ? 0.6 : 1
          }}
        >
          {cargando ? 'Enviando...' : 'Solicitar Cotización'}
        </button>
      </form>
    </main>
  );
}