'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import styles from './contactenos.module.css';

export default function Contactenos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Consulta General - Dolce Atelier',
    message: '',
  });

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Error al enviar el mensaje');
        }
        return result;
      }),
      {
        loading: 'Enviando correo vía Resend...',
        success: () => {
          setFormData({ name: '', email: '', subject: 'Consulta General - Dolce Atelier', message: '' });
          closeModal();
          return `¡Correo enviado exitosamente! Asunto: ${formData.subject}`;
        },
        error: (error) => error.message || 'Error al enviar el correo. Intenta de nuevo.',
      }
    );
  };

  return (
    <main className={styles.container}>
      <Toaster richColors position="top-center" />
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Contáctenos"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Contáctenos</h1>
          <p className={styles.heroText}>Estamos aquí para ti. Escríbenos, llámanos o visítanos.</p>
        </div>
      </section>

      <section className={styles.cardsSection}>
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <span className={styles.cardIcon}>📞</span>
            <h3 className={styles.cardTitle}>Teléfono</h3>
            <p className={styles.cardText}>¿Prefieres hablar directamente con nosotros? Estamos disponibles.</p>
            <a href="tel:+50760000000" className={styles.link}>+507 6000-0000</a>
          </div>

          <div className={styles.card}>
            <span className={styles.cardIcon}>💬</span>
            <h3 className={styles.cardTitle}>WhatsApp</h3>
            <p className={styles.cardText}>Chatea con nosotros de forma rápida y conveniente.</p>
            <a href="https://wa.me/50760000001" className={styles.link} target="_blank" rel="noopener noreferrer">+507 6000-0001</a>
          </div>

          <div className={styles.card}>
            <span className={styles.cardIcon}>✉️</span>
            <h3 className={styles.cardTitle}>Correo Electrónico</h3>
            <p className={styles.cardText}>¿Tienes alguna consulta? Te responderemos pronto.</p>
            <a href="#" onClick={handleEmailClick} className={styles.link}>dolceatelier@gmail.com</a>
          </div>

          <div className={styles.card}>
            <span className={styles.cardIcon}>📍</span>
            <h3 className={styles.cardTitle}>Dirección</h3>
            <p className={styles.cardText}>Visítanos en nuestro atelier. Con cita previa.</p>
            <p className={styles.addressText}>Calle 50, Paitilla<br />Ciudad de Panamá</p>
            <a href="https://maps.google.com/?q=Calle+50+Paitilla+Ciudad+de+Panama" target="_blank" rel="noopener noreferrer" className={styles.link} style={{ marginTop: '1rem' }}>
              Ver en Google Maps
            </a>
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.infoContainer}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>¿Tienes una queja o problema?</h2>
            <p className={styles.infoText}>
              Lamentamos que tu experiencia no haya sido la esperada. Por favor, contáctanos
              inmediatamente a través de cualquiera de nuestros canales. Tomamos muy en serio
              cada retroalimentación y nos comprometemos a resolver cualquier situación.
            </p>
            <p className={`${styles.infoText} ${styles.infoTextHighlight}`}>
              Tu satisfacción es nuestra prioridad número uno.
            </p>
          </div>

          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Horarios de Atención</h2>
            <p className={styles.infoText}>
              <strong>Lunes - Viernes:</strong> 8:00 AM - 6:00 PM<br />
              <strong>Sábado:</strong> 9:00 AM - 4:00 PM<br />
              <strong>Domingo:</strong> Cerrado
            </p>
            <p className={`${styles.infoText} ${styles.infoTextExtra}`}>
              Los días festivos puede variar nuestro horario.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>¿Listo para tu pastel perfecto?</h2>
        <p className={styles.ctaText}>Contáctanos para pedidos personalizados o cualquier consulta.</p>
        <Link href="/catalogo" className={styles.btn}>Ver Catálogo</Link>
      </section>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeModal}>×</button>
            <h2 className={styles.modalTitle}>Enviar Correo a Dolce Atelier</h2>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>Nombre</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Correo Electrónico (reply-to)</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.formLabel}>Asunto</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>Mensaje</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={4} className={styles.formInput} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className={styles.modalSubmitBtn}>Enviar Correo vía Resend</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
