'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

export default function Contactenos() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f5f5f5',
  };

  const heroSection: React.CSSProperties = {
    position: 'relative',
    height: isMobile ? '40vh' : '50vh',
    minHeight: isMobile ? 300 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const heroOverlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
    zIndex: 1,
  };

  const heroContent: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    color: '#fff',
    maxWidth: 700,
    padding: '0 2rem',
  };

  const heroTitle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 400,
    marginBottom: '1rem',
  };

  const heroText: React.CSSProperties = {
    fontSize: '1.2rem',
    opacity: 0.9,
    fontWeight: 300,
  };

  const cardsSection: React.CSSProperties = {
    padding: isMobile ? '2rem 1rem' : '4rem 2rem',
    maxWidth: 1200,
    margin: '0 auto',
  };

  const cardsGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: isMobile ? '1rem' : '2rem',
    marginTop: isMobile ? '-3rem' : '-5rem',
    position: 'relative',
    zIndex: 2,
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    padding: isMobile ? '1.5rem' : '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardIcon: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    display: 'block',
  };

  const cardTitle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.5rem',
    fontWeight: 500,
    marginBottom: '1rem',
    color: '#1a1a1a',
  };

  const cardText: React.CSSProperties = {
    color: '#666',
    marginBottom: '1.5rem',
    lineHeight: 1.7,
  };

  const linkStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#E11D48',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 500,
    transition: 'background 0.2s ease',
  };

  const infoSection: React.CSSProperties = {
    padding: isMobile ? '3rem 1rem' : '5rem 2rem',
    background: '#fff',
  };

  const infoContainer: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: isMobile ? '1.5rem' : '3rem',
  };

  const infoCard: React.CSSProperties = {
    padding: isMobile ? '1.5rem' : '2.5rem',
    borderRadius: '12px',
    background: '#faf9f8',
  };

  const infoTitle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: isMobile ? '1.25rem' : '1.75rem',
    fontWeight: 400,
    marginBottom: '1.5rem',
    color: '#1a1a1a',
  };

  const infoText: React.CSSProperties = {
    color: '#666',
    lineHeight: 1.8,
    marginBottom: '1rem',
    fontSize: isMobile ? '0.95rem' : '1.05rem',
  };

  const ctaSection: React.CSSProperties = {
    padding: isMobile ? '3rem 1rem' : '5rem 2rem',
    background: 'linear-gradient(135deg, #fdf5f5 0%, #fff 100%)',
    textAlign: 'center',
  };

  const ctaTitle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontSize: isMobile ? '1.5rem' : '2rem',
    fontWeight: 400,
    marginBottom: '1rem',
    color: '#1a1a1a',
  };

  const ctaText: React.CSSProperties = {
    color: '#666',
    marginBottom: '2rem',
    lineHeight: 1.7,
    maxWidth: isMobile ? '100%' : 500,
    margin: isMobile ? '0 auto 2rem' : '0 auto 2rem',
  };

  const btnStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: '#E11D48',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 500,
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem',
  };
  const modalContentStyle: React.CSSProperties = {
    background: '#fff', padding: '2.5rem', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: 500, width: '100%', position: 'relative',
  };
  const modalCloseBtnStyle: React.CSSProperties = {
    position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666',
  };
  const modalTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: '1.5rem', color: '#1a1a1a',
  };
  const modalFormStyle: React.CSSProperties = { display: 'grid', gap: '1.25rem' };
  const formGroupStyle: React.CSSProperties = { display: 'grid', gap: '0.5rem' };
  const formLabelStyle: React.CSSProperties = { color: '#1a1a1a', fontSize: '0.95rem', fontWeight: 500 };
  const formInputStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', border: '1px solid #eee', borderRadius: '8px', fontSize: '1rem', color: '#1a1a1a', outline: 'none',
  };
  const modalSubmitBtnStyle: React.CSSProperties = {
    padding: '0.875rem 1.5rem', background: '#E11D48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem',
  };

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
    <main style={containerStyle}>
      <Toaster richColors position="top-center" />
      <section style={heroSection}>
        <div style={heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Contáctenos"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={heroContent}>
          <h1 style={heroTitle}>Contáctenos</h1>
          <p style={heroText}>Estamos aquí para ti. Escríbenos, llámanos o visítanos.</p>
        </div>
      </section>

      <section style={cardsSection}>
        <div style={cardsGrid}>
          <div style={cardStyle}>
            <span style={cardIcon}>📞</span>
            <h3 style={cardTitle}>Teléfono</h3>
            <p style={cardText}>¿Prefieres hablar directamente con nosotros? Estamos disponibles.</p>
            <a href="tel:+50760000000" style={linkStyle}>+507 6000-0000</a>
          </div>

          <div style={cardStyle}>
            <span style={cardIcon}>💬</span>
            <h3 style={cardTitle}>WhatsApp</h3>
            <p style={cardText}>Chatea con nosotros de forma rápida y conveniente.</p>
            <a href="https://wa.me/50760000001" style={linkStyle} target="_blank" rel="noopener noreferrer">+507 6000-0001</a>
          </div>

          <div style={cardStyle}>
            <span style={cardIcon}>✉️</span>
            <h3 style={cardTitle}>Correo Electrónico</h3>
            <p style={cardText}>¿Tienes alguna consulta? Te responderemos pronto.</p>
            <a href="#" onClick={handleEmailClick} style={linkStyle}>dolceatelier@gmail.com</a>
          </div>

          <div style={cardStyle}>
            <span style={cardIcon}>📍</span>
            <h3 style={cardTitle}>Dirección</h3>
            <p style={cardText}>Visítanos en nuestro atelier. Con cita previa.</p>
            <p style={{ color: '#666', fontWeight: 500 }}>Calle 50, Paitilla<br />Ciudad de Panamá</p>
            <a href="https://maps.google.com/?q=Calle+50+Paitilla+Ciudad+de+Panama" target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, marginTop: '1rem' }}>
              Ver en Google Maps
            </a>
          </div>
        </div>
      </section>

      <section style={infoSection}>
        <div style={infoContainer}>
          <div style={infoCard}>
            <h2 style={infoTitle}>¿Tienes una queja o problema?</h2>
            <p style={infoText}>
              Lamentamos que tu experiencia no haya sido la esperada. Por favor, contáctanos
              inmediatamente a través de cualquiera de nuestros canales. Tomamos muy en serio
              cada retroalimentación y nos comprometemos a resolver cualquier situación.
            </p>
            <p style={{ ...infoText, color: '#E11D48', fontWeight: 600 }}>
              Tu satisfacción es nuestra prioridad número uno.
            </p>
          </div>

          <div style={infoCard}>
            <h2 style={infoTitle}>Horarios de Atención</h2>
            <p style={infoText}>
              <strong>Lunes - Viernes:</strong> 8:00 AM - 6:00 PM<br />
              <strong>Sábado:</strong> 9:00 AM - 4:00 PM<br />
              <strong>Domingo:</strong> Cerrado
            </p>
            <p style={{ ...infoText, marginTop: '1rem' }}>
              Los días festivos puede variar nuestro horario.
            </p>
          </div>
        </div>
      </section>

      <section style={ctaSection}>
        <h2 style={ctaTitle}>¿Listo para tu pastel perfecto?</h2>
        <p style={ctaText}>Contáctanos para pedidos personalizados o cualquier consulta.</p>
        <Link href="/catalogo" style={btnStyle}>Ver Catálogo</Link>
      </section>

    {isModalOpen && (
      <div style={modalOverlayStyle} onClick={closeModal}>
        <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
          <button style={modalCloseBtnStyle} onClick={closeModal}>×</button>
          <h2 style={modalTitleStyle}>Enviar Correo a Dolce Atelier</h2>
          <form onSubmit={handleSubmit} style={modalFormStyle}>
            <div style={formGroupStyle}>
              <label htmlFor="name" style={formLabelStyle}>Nombre</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required style={formInputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="email" style={formLabelStyle}>Correo Electrónico (reply-to)</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required style={formInputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="subject" style={formLabelStyle}>Asunto</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required style={formInputStyle} />
            </div>
            <div style={formGroupStyle}>
              <label htmlFor="message" style={formLabelStyle}>Mensaje</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={4} style={{ ...formInputStyle, resize: 'vertical' }} />
            </div>
            <button type="submit" style={modalSubmitBtnStyle}>Enviar Correo vía Resend</button>
          </form>
        </div>
      </div>
    )}

    </main>
  );
}