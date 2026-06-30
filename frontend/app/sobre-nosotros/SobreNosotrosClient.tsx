'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './sobre-nosotros.module.css';

export default function SobreNosotrosClient() {
  return (
    <main>
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <Image
          src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1920&h=1080&fit=crop"
          alt="Dolce Atelier"
          fill
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div className={styles.heroContent}>
          <p className={styles.heroSubtitle}>Sobre Nosotros</p>
          <h1 className={styles.heroTitle}>Donde Cada Bocado<br />Cuenta una Historia</h1>
          <p className={styles.heroText}>
            En Dolce Atelier, no solo creamos pasteles. Creamos momentos que se grabarán en tu memoria para siempre.
          </p>
          <Link href="/catalogo" className={styles.heroBtn}>Explorar Catálogo</Link>
        </div>
      </section>

      <section className={styles.historySection}>
        <div className={styles.historyContainer}>
          <div className={styles.historyCard}>
            <h2 className={styles.sectionTitle}>Nuestra Historia</h2>
            <p className={styles.textStyle}>
              <span className={styles.highlight}>Dolce Atelier</span> nació de una pasión incontrolable por el arte de la repostería artesanal. 
              Fundada con la creencia de que cada celebración merece ser acompañada por algo extraordinario, hemos dedicado años a 
              perfeccionar cada receta, cada detalle, cada decoración.
            </p>
            <p className={styles.textStyle}>
              Pero no hablamos solo de pasteles. HABLAMOS DE <span className={styles.highlight}>RECORDATORIOS</span>. 
              De esa abuela que siempre horneaba galletitas en las tardes lluviosas. De esa primera fecha importante donde todo tuvo que ser perfecto. 
              De ese momento donde tus ojos brillaron al ver el pastel de tus sueños hecho realidad.
            </p>
            <p className={styles.textStyle}>
              Entendemos que cuando un cliente entra a Dolce Atelier, no viene solo por un postre. 
              <span className={styles.highlight}> Viene por emociones</span>. Y es nuestra misión entregarles algo que trascienda lo ordinario.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Nuestra Esencia</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>✦</div>
            <h3 className={styles.featureTitle}>Artesanía Incomparable</h3>
            <p className={styles.featureText}>Cada pastel es una obra de arte única, elaborada a mano con ingredientes seleccionados premium.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>♥</div>
            <h3 className={styles.featureTitle}>Pasión por Detalles</h3>
            <p className={styles.featureText}>Los pequeños detalles crean grandes momentos. Cada decoración cuenta una historia.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🌟</div>
            <h3 className={styles.featureTitle}>Recetas con Alma</h3>
            <p className={styles.featureText}>Mezclamos tradición con innovación para crear sabores que despiertan recuerdos.</p>
          </div>
        </div>
      </section>

      <section className={styles.missionSection}>
        <div className={styles.missionContainer}>
          <div className={styles.missionCard}>
            <h2 className={styles.sectionTitle}>Nuestra Misión</h2>
            <p className={styles.textStyle}>
              En <span className={styles.highlight}>Dolce Atelier</span>, nuestra misión va más allá de la repostería.
            </p>
            <p className={styles.textStyle}>
              <strong>SOMOS</strong>: Traer alegría a cada hogar panameño a través de creaciones dulces que no solo 
              satisfacen el paladar, sino que <span className={styles.highlight}>alimentan el alma</span>.
            </p>
            <p className={styles.textStyle}>
              Cada pastel que sale de nuestra cocina lleva consigo la promesa de hacer tu momento especial más brillante.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueItem}>
              <span className={styles.valueIcon}>✓</span>
              <div>
                <h4 className={styles.valueTitle}>Ingredientes Premium</h4>
                <p className={styles.valueText}>Solo usamos chocolate belga, vainilla natural y frutas frescas de temporada.</p>
              </div>
            </div>
            <div className={styles.valueItem}>
              <span className={styles.valueIcon}>✓</span>
              <div>
                <h4 className={styles.valueTitle}>Elaboración Artesanal</h4>
                <p className={styles.valueText}>Cada pastel es elaborado a mano con dedicación y cuidado.</p>
              </div>
            </div>
            <div className={styles.valueItem}>
              <span className={styles.valueIcon}>✓</span>
              <div>
                <h4 className={styles.valueTitle}>Personalización Total</h4>
                <p className={styles.valueText}>Tu ideas y recetas especiales se convierten en realidad.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>¿Listo para Vivir la Experiencia Dolce?</h2>
          <p className={styles.ctaText}>
            Descubre nuestro catálogo de creaciones artesanales o contáctanos para tu pastel personalizado.
          </p>
          <Link href="/catalogo" className={styles.ctaBtn}>Ver Catálogo</Link>
        </div>
      </section>
    </main>
  );
}
