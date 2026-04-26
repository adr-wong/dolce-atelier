'use client';

import Link from 'next/link';
import Image from 'next/image';

const categorias = [
  { nombre: 'Chocolate', imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
  { nombre: 'Vainilla', imagen: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=400&fit=crop' },
  { nombre: 'Frutas', imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop' },
  { nombre: 'Personalizado', imagen: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400&h=400&fit=crop' },
];

export default function Home() {
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
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.9,
    fontWeight: 300,
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

  const heroScroll: React.CSSProperties = {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    color: '#fff',
    opacity: 0.7,
    fontSize: '1.5rem',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '5rem 2rem',
    background: '#faf9f8',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
  };

  const sectionHeader: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '3rem',
  };

  const sectionSubtitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '0.85rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#E11D48',
    marginBottom: '0.5rem',
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '2.5rem',
    fontWeight: 400,
    color: '#1a1a1a',
  };

  const categoriasGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2rem',
    maxWidth: 1000,
    margin: '0 auto',
  };

  const categoriaCard: React.CSSProperties = {
    display: 'block',
    textDecoration: 'none',
    textAlign: 'center',
  };

  const categoriaImgBox: React.CSSProperties = {
    width: 180,
    height: 180,
    borderRadius: '50%',
    overflow: 'hidden',
    margin: '0 auto 1rem',
    background: '#eee',
  };

  const categoriaNombre: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '1.25rem',
    fontWeight: 400,
    color: '#1a1a1a',
  };

  const featuresSection: React.CSSProperties = {
    padding: '5rem 2rem',
    background: '#fff',
  };

  const featuresGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
    maxWidth: 1000,
    margin: '0 auto',
  };

  const featureItem: React.CSSProperties = {
    textAlign: 'center',
  };

  const featureTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 400,
    marginBottom: '0.75rem',
    color: '#1a1a1a',
  };

  const featureText: React.CSSProperties = {
    color: '#666',
    lineHeight: 1.7,
  };

  const ctaSection: React.CSSProperties = {
    padding: '5rem 2rem',
    background: 'linear-gradient(135deg, #fdf5f5 0%, #fff 100%)',
    textAlign: 'center',
  };

  const ctaTitle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '2rem',
    fontWeight: 400,
    marginBottom: '1rem',
    color: '#1a1a1a',
  };

  const ctaText: React.CSSProperties = {
    color: '#666',
    marginBottom: '2rem',
    lineHeight: 1.7,
  };

  const ctaBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '1rem 2rem',
    background: '#E11D48',
    color: '#fff',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 500,
  };

  const footerStyle: React.CSSProperties = {
    padding: '4rem 2rem',
    background: '#1a1a1a',
    color: '#fff',
  };

  const footerGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '3rem',
    maxWidth: 1200,
    margin: '0 auto 3rem',
  };

  const footerCol: React.CSSProperties = {};

  const footerLogo: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: '1.5rem',
    fontWeight: 400,
    marginBottom: '1rem',
  };

  const footerHeading: React.CSSProperties = {
    fontSize: '0.9rem',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    color: '#999',
  };

  const footerText: React.CSSProperties = {
    color: '#fff',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  };

  const footerBottom: React.CSSProperties = {
    borderTop: '1px solid #333',
    paddingTop: '2rem',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
  };

  return (
    <main>
      <section style={heroSection}>
        <div style={heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Pastel elegante"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div style={heroContent}>
          <p style={heroSubtitle}>Pasteles Artesanales</p>
          <h1 style={heroTitle}>Dolce Atelier</h1>
          <p style={heroText}>Elaborados con amor, ingredientes premium y la más alta calidad</p>
          <Link href="/catalogo" style={heroBtn}>Ver Catálogo</Link>
        </div>
        <div style={heroScroll}>↓</div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={sectionHeader}>
            <p style={sectionSubtitle}>Nuestros Sabores</p>
            <h2 style={sectionTitle}>Categorías</h2>
          </div>
          <div style={categoriasGrid}>
            {categorias.map((cat) => (
              <Link key={cat.nombre} href={`/catalogo?categoria=${cat.nombre.toLowerCase()}`} style={categoriaCard}>
                <div style={categoriaImgBox}>
                  <Image src={cat.imagen} alt={cat.nombre} width={180} height={180} style={{ objectFit: 'cover' }} />
                </div>
                <h3 style={categoriaNombre}>{cat.nombre}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={featuresSection}>
        <div style={containerStyle}>
          <div style={featuresGrid}>
            {[
              { titulo: 'Artesanales', desc: 'Cada pastel es elaborado a mano con dedicación y cuidado artesanal.' },
              { titulo: 'Ingredientes Premium', desc: 'Solo usamos chocolate belga, vainilla natural y frutas frescas.' },
              { titulo: 'Personalización', desc: 'Envíanos tu receta o idea y la convertiremos en realidad.' },
            ].map((item) => (
              <div key={item.titulo} style={featureItem}>
                <h3 style={featureTitle}>{item.titulo}</h3>
                <p style={featureText}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={ctaSection}>
        <div style={containerStyle}>
          <h2 style={ctaTitle}>¿Tienes una receta especial?</h2>
          <p style={ctaText}>Envíanos tu receta personalizada y te cotizaremos un pastel único hecho especialmente para ti.</p>
          <Link href="/recetas" style={ctaBtn}>Solicitar Cotización</Link>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={containerStyle}>
          <div style={footerGrid}>
            <div style={footerCol}>
              <h3 style={footerLogo}>Dolce Atelier</h3>
              <p style={{ ...footerText, color: '#999' }}>Pasteles artesanales elaborados con amor y los mejores ingredientes.</p>
            </div>
            <div style={footerCol}>
              <h4 style={footerHeading}>HORARIO</h4>
              <p style={footerText}>Lun - Vie: 8:00 AM - 7:00 PM</p>
              <p style={footerText}>Sábados: 9:00 AM - 5:00 PM</p>
            </div>
            <div style={footerCol}>
              <h4 style={footerHeading}>CONTACTO</h4>
              <p style={footerText}>Av. Principal #123</p>
              <p style={footerText}>Ciudad, México</p>
              <p style={{ ...footerText, color: '#E11D48' }}>+52 55 1234 5678</p>
            </div>
          </div>
          <div style={footerBottom}>© 2026 Dolce Atelier. Todos los derechos reservados.</div>
        </div>
      </footer>
    </main>
  );
}