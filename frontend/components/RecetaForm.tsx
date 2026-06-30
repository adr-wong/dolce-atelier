'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/get-api-url';
import styles from '@/app/recetas/recetas.module.css';

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
  const [archivo, setArchivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no debe superar 10MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG, WebP o PDF');
        return;
      }
      setArchivo(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'dolce_atelier_unsigned');
      formDataUpload.append('folder', 'recetas');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir archivo');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

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

      let archivoUrl: string | null = null;
      if (archivo) {
        setUploading(true);
        archivoUrl = await uploadFile(archivo);
        setUploading(false);
        if (!archivoUrl) {
          toast.error('Error al subir el archivo');
          setLoading(false);
          return;
        }
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
          archivoUrl: archivoUrl || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la receta');
      }
      
      toast.success('Receta enviada exitosamente. Recibirás una cotización pronto.');
      setFormData({ nota: '', personas: 10 });
      setArchivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar la receta');
    } finally {
      setLoading(false);
      setUploading(false);
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="archivo">
          Imagen de referencia (opcional)
        </label>
        <input
          ref={fileInputRef}
          id="archivo"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className={styles.input}
          disabled={loading || uploading}
        />
        {archivo && (
          <p className={styles.fileInfo}>
            Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
      
      <button 
        type="submit" 
        className={styles.submitBtn}
        disabled={loading || uploading}
      >
        {uploading ? 'Subiendo archivo...' : loading ? 'Enviando...' : 'Enviar Receta'}
      </button>
    </form>
  );
}
