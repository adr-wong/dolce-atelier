'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function SobreNosotros() {
  const heroSection: React.CSSProperties = {
    position: 'relative',
    height: '85vh',
    minHeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#f5f5f5',
  };

  const heroOverlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
    zIndex: 1,
  };

  const heroContent: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    color: '#fff',
    maxWidth: 800,
    padding: '0 2rem',
  };

  const heroSubtitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
    opacity: 0.9,
  };

  const heroTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: 400,
    marginBottom: '1.5rem',
    lineHeight: 1.1,
  };

  const heroText: React.CSSProperties = {
    fontSize: '1.25rem',
    marginBottom: '2rem',
    opacity: 0.9,
    fontWeight: 300,
    lineHeight: 1.8,
  };

  const heroBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '1rem 2.5rem',
    background: '#E11D48',
    color: '#fff',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    letterSpacing: '0.05em',
  };

  const historySection: React.CSSProperties = {
    padding: '6rem 2rem',
    background: '#faf9f8',
  };

  const historyContainer: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
  };

  const historyCard: React.CSSProperties = {
    background: '#fff',
    padding: '4rem',
    borderRadius: '12px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '2.5rem',
    fontWeight: 400,
    textAlign: 'center',
    marginBottom: '3rem',
    color: '#1a1a1a',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '1.15rem',
    lineHeight: 2,
    color: '#555',
    marginBottom: '1.5rem',
  };

  const highlight: React.CSSProperties = {
    color: '#E11D48',
    fontStyle: 'italic',
    fontWeight: 500,
  };

  const featuresSection: React.CSSProperties = {
    padding: '6rem 2rem',
    background: '#fff',
  };

  const featuresGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
    maxWidth: 1100,
    margin: '0 auto',
  };

  const featureItem: React.CSSProperties = {
    textAlign: 'center',
    padding: '2rem',
    borderRadius: '12px',
    background: '#faf9f8',
    transition: 'transform 0.3s ease',
  };

  const featureIcon: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '1.5rem',
  };

  const featureTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 400,
    marginBottom: '1rem',
    color: '#1a1a1a',
  };

  const featureText: React.CSSProperties = {
    color: '#666',
    lineHeight: 1.7,
    fontSize: '1.05rem',
  };

  const missionSection: React.CSSProperties = {
    padding: '6rem 2rem',
    background: '#faf9f8',
  };

  const missionContainer: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
  };

  const missionCard: React.CSSProperties = {
    background: '#fff',
    padding: '4rem',
    borderRadius: '12px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  };

  const valuesGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '3rem',
  };

  const valueItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem',
  };

  const valueIcon: React.CSSProperties = {
    fontSize: '1.5rem',
    color: '#E11D48',
  };

  const valueTitle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  };

  const valueText: React.CSSProperties = {
    color: '#666',
    lineHeight: 1.6,
  };

  const ctaSection: React.CSSProperties = {
    padding: '6rem 2rem',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: '#fff',
    textAlign: 'center',
  };

  const ctaContainer: React.CSSProperties = {
    maxWidth: 700,
    margin: '0 auto',
  };

  const ctaTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '2.5rem',
    fontWeight: 400,
    marginBottom: '1rem',
  };

  const ctaText: React.CSSProperties = {
    fontSize: '1.15rem',
    opacity: 0.9,
    marginBottom: '2rem',
    lineHeight: 1.8,
  };

  const ctaBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '1rem 2.5rem',
    background: '#E11D48',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 500,
    fontSize: '1rem',
    letterSpacing: '0.05em',
  };

  return (
    <main>
      <section style={heroSection}>
        <div style={heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Dolce Atelier"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div style={heroContent}>
          <p style={heroSubtitle}>Sobre Nosotros</p>
          <h1 style={heroTitle}>Donde Cada Bocado<br />Cuenta una Historia</h1>
          <p style={heroText}>
            En Dolce Atelier, no solo creamos pasteles. Creamos momentos que se grabarán en tu memoria para siempre.
          </p>
          <Link href="/catalogo" style={heroBtn}>Explorar Catálogo</Link>
        </div>
      </section>

      <section style={historySection}>
        <div style={historyContainer}>
          <div style={historyCard}>
            <h2 style={sectionTitle}>Nuestra Historia</h2>
            <p style={textStyle}>
              <span style={highlight}>Dolce Atelier</span> nació de una pasión incontrolable por el arte de la repostería artesanal. 
              Fundada con la creencia de que cada celebración merece ser acompañada por algo extraordinario, hemos dedicado años a 
              perfeccionar cada receta, cada detalle, cada decoración.
            </p>
            <p style={textStyle}>
              Pero no hablamos solo de pasteles. HABLAMOS DE <span style={highlight}>RECORDATORIOS</span>. 
              De esa abuela que siempre horneaba galletitas en las tardes lluviosas. De esa primera fecha importante donde todo tuvo que ser perfecto. 
              De ese momento donde tus ojos brillaron al ver el pastel de tus sueños hecho realidad.
            </p>
            <p style={textStyle}>
              Entendemos que cuando un cliente entra a Dolce Atelier, no viene solo por un postre. 
              <span style={highlight}> Viene por emociones</span>. Y es nuestra misión entregarles algo que trascienda lo ordinario.
            </p>
          </div>
        </div>
      </section>

      <section style={featuresSection}>
        <h2 style={sectionTitle}>Nuestra Esencia</h2>
        <div style={featuresGrid}>
          <div style={featureItem}>
            <div style={featureIcon}>✦</div>
            <h3 style={featureTitle}>Artesanía Incomparable</h3>
            <p style={featureText}>Cada pastel es una obra de arte única, elaborada a mano con ingredientes seleccionados premium.</p>
          </div>
          <div style={featureItem}>
            <div style={featureIcon}>♥</div>
            <h3 style={featureTitle}>Pasión por Detalles</h3>
            <p style={featureText}>Los pequeños detalles crean grandes momentos. Cada decoración cuenta una historia.</p>
          </div>
          <div style={featureItem}>
            <div style={featureIcon}>🌟</div>
            <h3 style={featureTitle}>Recetas con Alma</h3>
            <p style={featureText}>Mezclamos tradición con innovación para crear sabores que despiertan recuerdos.</p>
          </div>
        </div>
      </section>

      <section style={missionSection}>
        <div style={missionContainer}>
          <div style={missionCard}>
            <h2 style={sectionTitle}>Nuestra Misión</h2>
            <p style={textStyle}>
              En <span style={highlight}>Dolce Atelier</span>, nuestra misión va más allá de la repostería.
            </p>
            <p style={textStyle}>
              <strong>SOMOS</strong>: Traer alegría a cada hogar panameño a través de creaciones dulces que no solo 
              satisfacen el paladar, sino que <span style={highlight}>alimentan el alma</span>.
            </p>
            <p style={textStyle}>
              Cada pastel que sale de nuestra cocina lleva consigo la promesa de hacer tu momento especial más brillante.
            </p>
          </div>

          <div style={valuesGrid}>
            <div style={valueItem}>
              <span style={valueIcon}>✓</span>
              <div>
                <h4 style={valueTitle}>Ingredientes Premium</h4>
                <p style={valueText}>Solo usamos chocolate belga, vainilla natural y frutas frescas de temporada.</p>
              </div>
            </div>
            <div style={valueItem}>
              <span style={valueIcon}>✓</span>
              <div>
                <h4 style={valueTitle}>Elaboración Artesanal</h4>
                <p style={valueText}>Cada pastel es elaborado a mano con dedicación y cuidado.</p>
              </div>
            </div>
            <div style={valueItem}>
              <span style={valueIcon}>✓</span>
              <div>
                <h4 style={valueTitle}>Personalización Total</h4>
                <p style={valueText}>Tu ideas y recetas especiales se convierten en realidad.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={ctaSection}>
        <div style={ctaContainer}>
          <h2 style={ctaTitle}>¿Listo para Vivir la Experiencia Dolce?</h2>
          <p style={ctaText}>
            Descubre nuestro catálogo de creaciones artesanales o contáctanos para tu pastel personalizado.
          </p>
          <Link href="/catalogo" style={ctaBtn}>Ver Catálogo</Link>
        </div>
      </section>
    </main>
  );
}