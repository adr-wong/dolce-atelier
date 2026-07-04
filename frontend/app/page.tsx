import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './home.module.css';
import AuthButtons from '@/components/AuthButtons';

export const metadata: Metadata = {
  title: 'Dolce Atelier | Pasteles Artesanales Personalizados',
  description: 'Pasteles artesanales elaborados con amor y los mejores ingredientes. Chocolate belga, vainilla natural, frutas frescas. Personaliza tu pastel ideal.',
  openGraph: {
    title: 'Dolce Atelier | Pasteles Artesanales Personalizados',
    description: 'Pasteles artesanales elaborados con amor y los mejores ingredientes.',
    type: 'website',
    locale: 'es_MX',
  },
};

const categorias = [
  { nombre: 'Chocolate', imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
  { nombre: 'Vainilla', imagen: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=400&fit=crop' },
  { nombre: 'Frutas', imagen: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop' },
  { nombre: 'Personalizado', imagen: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=400&h=400&fit=crop' },
];

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Pastel elegante"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div className={styles.heroContent}>
          <p className={styles.heroSubtitle}>Pasteles Artesanales</p>
          <h1 className={styles.heroTitle}>Dolce Atelier</h1>
          <p className={styles.heroText}>Elaborados con amor, ingredientes premium y la más alta calidad</p>
          <Link href="/catalogo" className="hero-btn">Ver Catálogo</Link>
          <AuthButtons />
        </div>
        <div className={styles.heroScroll}>↓</div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionSubtitle}>Nuestros Sabores</p>
            <h2 className={styles.sectionTitle}>Categorías</h2>
          </div>
          <div className={styles.categoriesGrid}>
            {categorias.map((cat) => (
              <Link key={cat.nombre} href={`/catalogo?categoria=${cat.nombre.toLowerCase()}`} className={styles.categoryCard}>
                <div className={styles.categoryImgBox}>
                  <Image src={cat.imagen} alt={cat.nombre} width={180} height={180} style={{ objectFit: 'cover' }} />
                </div>
                <h3 className={styles.categoryName}>{cat.nombre}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            {[
              { titulo: 'Artesanales', desc: 'Cada pastel es elaborado a mano con dedicación y cuidado artesanal.' },
              { titulo: 'Ingredientes Premium', desc: 'Solo usamos chocolate belga, vainilla natural y frutas frescas.' },
              { titulo: 'Personalización', desc: 'Envíanos tu receta o idea y la convertiremos en realidad.' },
            ].map((item) => (
              <div key={item.titulo} className={styles.featureItem}>
                <h3 className={styles.featureTitle}>{item.titulo}</h3>
                <p className={styles.featureText}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>¿Tienes una receta especial?</h2>
          <p className={styles.ctaText}>Envíanos tu receta personalizada y te cotizaremos un pastel único hecho especialmente para ti.</p>
          <Link href="/recetas" className="cta-btn">Solicitar Cotización</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <h3 className={styles.footerLogo}>Dolce Atelier</h3>
              <p className={styles.footerTextGray}>Pasteles artesanales elaborados con amor y los mejores ingredientes.</p>
            </div>
            <div>
              <h4 className={styles.footerHeading}>HORARIO</h4>
              <p className={styles.footerText}>Lun - Vie: 8:00 AM - 7:00 PM</p>
              <p className={styles.footerText}>Sábados: 9:00 AM - 5:00 PM</p>
            </div>
            <div>
              <h4 className={styles.footerHeading}>CONTACTO</h4>
              <p className={styles.footerText}>Av. Principal #123</p>
              <p className={styles.footerText}>Ciudad, México</p>
              <p className={styles.footerTextPrimary}>+52 55 1234 5678</p>
            </div>
          </div>
          <div className={styles.footerBottom}>© 2026 Dolce Atelier. Todos los derechos reservados.</div>
        </div>
      </footer>
    </main>
  );
}
