# Refactor Responsive + Limpieza — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all inline styles to CSS Modules with unified breakpoints (480/768/1024), clean up dead code, unify types, and fix backend issues.

**Architecture:** CSS Modules per page/component with native `@media` queries. `useMediaQuery` hook reduced to JS-conditional logic only. All breakpoints unified under CSS custom properties.

**Tech Stack:** Next.js 14 App Router, TypeScript, vanilla CSS Modules, Zustand, Clerk

---

### Task 1: Setup — Unified Breakpoints in globals.css

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Add breakpoint variables and shared responsive patterns**

Add after the existing `:root` block (line 13):

```css
:root {
  --bp-mobile: 480px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
  --primary: #E11D48;
  --primary-dark: #be123c;
  --dark: #1a1a1a;
  --light: #fff;
  --gray: #666;
  --gray-light: #f5f5f5;
  --shadow: 0 4px 20px rgba(0,0,0,0.1);
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;
}
```

Also add utility classes for shared button/link patterns:

```css
.btn-primary {
  display: inline-block;
  background: var(--primary);
  color: var(--light);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(225, 29, 72, 0.3);
}

.section-padding {
  padding: 5rem 2rem;
}

@media (max-width: 768px) {
  .section-padding {
    padding: 3rem 1rem;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: add unified breakpoint variables and shared utility classes"
```

---

### Task 2: Clean useMediaQuery hook — align breakpoints

**Files:**
- Modify: `frontend/hooks/useMediaQuery.ts`

- [ ] **Step 1: Update breakpoints in convenience wrappers**

Replace the entire file content:

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function useMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/hooks/useMediaQuery.ts
git commit -m "fix: unify useMediaQuery breakpoints to 768/1024 and simplify hook"
```

---

### Task 3: Home page — extract to CSS Module

**Files:**
- Create: `frontend/app/home.module.css`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Create home.module.css**

```css
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--gray-light);
  height: 85vh;
  min-height: 600px;
  padding: 0;
}

@media (max-width: 768px) {
  .hero {
    height: 70vh;
    min-height: 500px;
    padding: 1rem;
  }
}

.heroOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
  z-index: 1;
}

.heroContent {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
  max-width: 700px;
  padding: 0 2rem;
}

.heroSubtitle {
  font-family: var(--font-serif);
  font-size: 0.9rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.heroTitle {
  font-family: var(--font-serif);
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 400;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.heroText {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  font-weight: 300;
}

.heroScroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  color: #fff;
  opacity: 0.7;
  font-size: 1.5rem;
}

.section {
  padding: 5rem 2rem;
  background: #faf9f8;
}

@media (max-width: 768px) {
  .section {
    padding: 3rem 1rem;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
}

.sectionHeader {
  text-align: center;
  margin-bottom: 3rem;
}

.sectionSubtitle {
  font-family: var(--font-serif);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.sectionTitle {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--dark);
}

@media (max-width: 768px) {
  .sectionTitle {
    font-size: 1.75rem;
  }
}

.categoriasGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .categoriasGrid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

.categoriaCard {
  display: block;
  text-decoration: none;
  text-align: center;
}

.categoriaImgBox {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
  background: #eee;
}

@media (max-width: 768px) {
  .categoriaImgBox {
    width: 120px;
    height: 120px;
  }
}

.categoriaNombre {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--dark);
}

.featuresSection {
  padding: 5rem 2rem;
  background: #fff;
}

@media (max-width: 768px) {
  .featuresSection {
    padding: 3rem 1rem;
  }
}

.featuresGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .featuresGrid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.featureItem {
  text-align: center;
}

.featureTitle {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 0.75rem;
  color: var(--dark);
}

.featureText {
  color: var(--gray);
  line-height: 1.7;
}

.ctaSection {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #fdf5f5 0%, #fff 100%);
  text-align: center;
}

@media (max-width: 768px) {
  .ctaSection {
    padding: 3rem 1rem;
  }
}

.ctaTitle {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 1rem;
  color: var(--dark);
}

@media (max-width: 768px) {
  .ctaTitle {
    font-size: 1.5rem;
  }
}

.ctaText {
  color: var(--gray);
  margin-bottom: 2rem;
  line-height: 1.7;
  padding: 0;
}

@media (max-width: 768px) {
  .ctaText {
    padding: 0 1rem;
  }
}

.footer {
  padding: 4rem 2rem;
  background: var(--dark);
  color: #fff;
}

@media (max-width: 768px) {
  .footer {
    padding: 3rem 1rem;
  }
}

.footerGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
}

@media (max-width: 768px) {
  .footerGrid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.footerLogo {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 1rem;
}

.footerHeading {
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
  color: #999;
}

.footerText {
  color: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.footerTextMuted {
  color: #999;
}

.footerTextAccent {
  color: var(--primary);
}

.footerBottom {
  border-top: 1px solid #333;
  padding-top: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.85rem;
}
```

- [ ] **Step 2: Rewrite page.tsx with css modules (no more inline styles)**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import styles from './home.module.css';

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
          <Link href="/catalogo" className="btn-primary" style={{ padding: '1rem 2.5rem' }}>Ver Catálogo</Link>
        </div>
        <div className={styles.heroScroll}>↓</div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionSubtitle}>Nuestros Sabores</p>
            <h2 className={styles.sectionTitle}>Categorías</h2>
          </div>
          <div className={styles.categoriasGrid}>
            {categorias.map((cat) => (
              <Link key={cat.nombre} href={`/catalogo?categoria=${cat.nombre.toLowerCase()}`} className={styles.categoriaCard}>
                <div className={styles.categoriaImgBox}>
                  <Image src={cat.imagen} alt={cat.nombre} width={180} height={180} style={{ objectFit: 'cover' }} />
                </div>
                <h3 className={styles.categoriaNombre}>{cat.nombre}</h3>
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
          <Link href="/recetas" className="btn-primary" style={{ padding: '1rem 2rem' }}>Solicitar Cotización</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <h3 className={styles.footerLogo}>Dolce Atelier</h3>
              <p className={styles.footerTextMuted}>Pasteles artesanales elaborados con amor y los mejores ingredientes.</p>
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
              <p className={styles.footerTextAccent}>+52 55 1234 5678</p>
            </div>
          </div>
          <div className={styles.footerBottom}>© 2026 Dolce Atelier. Todos los derechos reservados.</div>
        </div>
      </footer>
    </main>
  );
}
```

Note: The home page no longer needs `'use client'` directive since it doesn't use `useMediaQuery` anymore. All responsive behavior is handled by CSS.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/home.module.css frontend/app/page.tsx
git commit -m "refactor: extract home page inline styles to CSS module"
```

---

### Task 4: Catalog page — extract to CSS Module

**Files:**
- Create: `frontend/app/catalogo/catalogo.module.css`
- Modify: `frontend/app/catalogo/page.tsx`

- [ ] **Step 1: Create catalogo.module.css**

```css
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }
}

.title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--dark);
}

.cartLink {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  position: relative;
}

.cartBadge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #fff;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-decoration: none;
  text-transform: capitalize;
  font-weight: 500;
}

.tabActive {
  background: var(--primary);
  color: #fff;
  border: 1px solid var(--primary);
}

.tabInactive {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}

.imageContainer {
  position: relative;
  width: 100%;
  height: 250px;
  background: var(--gray-light);
}

@media (max-width: 768px) {
  .imageContainer {
    height: 200px;
  }
}

.content {
  padding: 1.5rem;
}

.nombre {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--dark);
}

.descripcion {
  font-size: 0.9rem;
  color: var(--gray);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.precio {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary);
}

.addButton {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pageBtn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
}

.pageBtnActive {
  background: var(--primary);
  color: #fff;
}

.pageBtnInactive {
  background: #fff;
  color: #333;
}

.empty {
  text-align: center;
  padding: 4rem;
}
```

- [ ] **Step 2: Rewrite catalogo/page.tsx**

Replace the file content to use CSS modules. Remove the `useMediaQuery` import (no longer needed for styles) and replace all `style={...}` with `className={styles....}`. Keep the import of `Pastel` from `@/lib/types` instead of the inline interface.

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useTransition } from 'react';
import { useCarritoStore } from '@/store/carrito';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Pastel } from '@/lib/types';
import styles from './catalogo.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CATEGORIAS = ['todos', 'chocolate', 'vainilla', 'frutas', 'especial'];

interface CatalogoDatos {
  pasteles: Pastel[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoria = searchParams.get('categoria') || 'todos';
  const page = parseInt(searchParams.get('page') || '1');
  
  const agregar = useCarritoStore(s => s.agregar);
  const items = useCarritoStore(s => s.items);
  const [datos, setDatos] = useState<CatalogoDatos | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  useEffect(() => {
    async function cargarPasteles() {
      setLoading(true);
      try {
        const catParam = categoria !== 'todos' ? `&categoria=${categoria}` : '';
        const res = await fetch(`${API_URL}/api/pasteles?page=${page}&limit=12${catParam}`);
        const data = await res.json();
        setDatos(data);
      } catch (error) {
        console.error('Error cargando pasteles:', error);
        setDatos({ pasteles: [], total: 0, page: 1, totalPages: 1 });
      } finally {
        setLoading(false);
      }
    }
    cargarPasteles();
  }, [categoria, page]);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  const pasteles = datos?.pasteles?.filter(p => p.disponible) || [];

  const handleAgregar = (pastel: Pastel) => {
    agregar(pastel);
  };

  const cambiarPagina = (nuevaPagina: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', nuevaPagina.toString());
      router.push(`/catalogo?${params.toString()}`);
    });
  };

  return (
    <main className={styles.container} style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Nuestro Catálogo</h1>
        <Link href="/carrito" className={styles.cartLink}>
          🛒 Carrito
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </Link>
      </div>

      <div className={styles.tabs}>
        {CATEGORIAS.map(cat => (
          <Link
            key={cat}
            href={cat === 'todos' ? '/catalogo?page=1' : `/catalogo?categoria=${cat}&page=1`}
            className={`${styles.tab} ${categoria === cat || (cat === 'todos' && !categoria) ? styles.tabActive : styles.tabInactive}`}
          >
            {cat === 'todos' ? 'Todos' : cat}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className={styles.empty}>
          <p>Cargando pasteles...</p>
        </div>
      ) : pasteles.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay pasteles disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pasteles.map(pastel => (
            <div key={pastel._id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.content}>
                <h3 className={styles.nombre}>{pastel.nombre}</h3>
                <p className={styles.descripcion}>{pastel.descripcion}</p>
                <div className={styles.actions}>
                  <span className={styles.precio}>${pastel.precio}</span>
                  <button onClick={() => handleAgregar(pastel)} className={styles.addButton}>
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {datos && datos.totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: datos.totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => cambiarPagina(num)}
              className={`${styles.pageBtn} ${datos.page === num ? styles.pageBtnActive : styles.pageBtnInactive}`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/catalogo/catalogo.module.css frontend/app/catalogo/page.tsx
git commit -m "refactor: extract catalog page inline styles to CSS module, use shared Pastel type"
```

---

### Task 5: Cart page — extract to CSS Module

**Files:**
- Create: `frontend/app/carrito/carrito.module.css`
- Modify: `frontend/app/carrito/page.tsx`

- [ ] **Step 1: Create carrito.module.css**

```css
.container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 4rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
    padding-top: 6rem;
  }
}

.emptyState {
  padding: 4rem 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .emptyState {
    padding: 6rem 1rem;
  }
}

.emptyTitle {
  margin-bottom: 1rem;
}

.emptyText {
  color: var(--gray);
  margin-bottom: 2rem;
}

.catalogBtn {
  padding: 1rem 2rem;
  background: var(--primary);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }
}

.title {
  font-family: var(--font-serif);
  font-size: 2rem;
}

@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }
}

.clearBtn {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.itemCard {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid #eee;
}

@media (max-width: 768px) {
  .itemCard {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
}

.itemImage {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .itemImage {
    width: 100%;
    height: 150px;
  }
}

.itemInfo {
  flex: 1;
}

.itemName {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.itemPrice {
  color: var(--gray);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantityBox {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.qtyBtn {
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.qtyValue {
  padding: 0 1rem;
}

.deleteBtn {
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.itemTotal {
  text-align: right;
  font-weight: bold;
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .itemTotal {
    text-align: left;
  }
}

.summary {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
}

@media (max-width: 768px) {
  .summary {
    padding: 1rem;
  }
}

.summaryTitle {
  margin-bottom: 1rem;
  font-family: var(--font-serif);
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.shipping {
  color: #10b981;
}

.totalRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.totalAmount {
  font-size: 1.25rem;
  font-weight: bold;
}

.checkoutBtn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.divider {
  margin: 1rem 0;
}
```

- [ ] **Step 2: Rewrite carrito/page.tsx**

Replace with css module version. Remove useMediaQuery import and all inline styles.

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import styles from './carrito.module.css';

export default function CarritoPage() {
  const { items, actualizarCantidad, quitar, limpiar, total } = useCarritoStore();

  if (items.length === 0) {
    return (
      <main className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Tu Carrito está Vacío</h1>
        <p className={styles.emptyText}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" className={styles.catalogBtn}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tu Carrito ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</h1>
        <button onClick={limpiar} className={styles.clearBtn}>
          Vaciar carrito
        </button>
      </div>

      <div className={styles.grid}>
        <div>
          {items.map(({ pastel, cantidad }) => (
            <div key={pastel._id} className={styles.itemCard}>
              <div className={styles.itemImage}>
                <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{pastel.nombre}</h3>
                <p className={styles.itemPrice}>${pastel.precio} c/u</p>
                <div className={styles.controls}>
                  <div className={styles.quantityBox}>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad - 1)} className={styles.qtyBtn}>-</button>
                    <span className={styles.qtyValue}>{cantidad}</span>
                    <button onClick={() => actualizarCantidad(pastel._id, cantidad + 1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <button onClick={() => quitar(pastel._id)} className={styles.deleteBtn}>
                    Eliminar
                  </button>
                </div>
              </div>
              <div className={styles.itemTotal}>
                <p>${(pastel.precio * cantidad).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Resumen</h3>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span className={styles.shipping}>Calculado en checkout</span>
          </div>
          <hr className={styles.divider} />
          <div className={styles.totalRow}>
            <strong>Total</strong>
            <strong className={styles.totalAmount}>${total().toFixed(2)}</strong>
          </div>
          <Link href="/checkout" className={styles.checkoutBtn}>
            Proceder al Pago
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/carrito/carrito.module.css frontend/app/carrito/page.tsx
git commit -m "refactor: extract cart page inline styles to CSS module"
```

---

### Task 6: Checkout page — extract to CSS Module

**Files:**
- Create: `frontend/app/checkout/checkout.module.css`
- Modify: `frontend/app/checkout/page.tsx`

- [ ] **Step 1: Create checkout.module.css**

```css
.container {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 4rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
    padding-top: 6rem;
  }
}

.emptyState {
  padding: 4rem 2rem;
  text-align: center;
}

@media (max-width: 768px) {
  .emptyState {
    padding: 6rem 1rem;
  }
}

.backLink {
  margin-bottom: 1.5rem;
}

.backLink a {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.title {
  margin-bottom: 2rem;
  font-family: var(--font-serif);
  font-size: 2rem;
}

@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }
}

.formGrid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 3rem;
}

@media (max-width: 768px) {
  .formGrid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.section {
  margin-bottom: 2.5rem;
}

.sectionTitle {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .sectionTitle {
    font-size: 1.1rem;
  }
}

.inputGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .inputGrid {
    grid-template-columns: 1fr;
  }
}

.inputGroup {
  display: flex;
  flex-direction: column;
}

.inputGroupFull {
  grid-column: 1 / -1;
}

.inputLabel {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--gray);
}

.textInput {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.methodSelector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .methodSelector {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.methodBtn {
  flex: 1;
  padding: 1.5rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

@media (max-width: 768px) {
  .methodBtn {
    padding: 1rem;
  }
}

.methodBtnActive {
  border-color: var(--primary);
  background: #fdf5f7;
}

.methodLabel {
  font-weight: 500;
}

.methodSubtext {
  font-size: 0.85rem;
  color: var(--gray);
  margin-top: 0.25rem;
}

.summary {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
}

@media (max-width: 768px) {
  .summary {
    padding: 1rem;
  }
}

.summaryTitle {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.summaryItem {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.summaryItemImage {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.summaryItemInfo {
  flex: 1;
}

.summaryItemName {
  font-weight: 500;
  font-size: 0.9rem;
}

.summaryItemQty {
  color: var(--gray);
  font-size: 0.85rem;
}

.summaryItemPrice {
  font-weight: 500;
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.summaryRowLabel {
  color: var(--gray);
}

.summaryShipping {
  color: #10b981;
}

.summaryDivider {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid #ddd;
}

.summaryTotalRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.summaryTotalAmount {
  font-size: 1.25rem;
}

.submitBtn {
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.submitBtnDisabled {
  background: #ccc;
  cursor: not-allowed;
}
```

- [ ] **Step 2: Rewrite checkout/page.tsx with CSS modules**

Remove `useMediaQuery` import and all inline styles. Replace with CSS module classes.

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useCarritoStore } from '@/store/carrito';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { items, total } = useCarritoStore();
  const { getToken } = useAuth();
  const [metodoEntrega, setMetodoEntrega] = useState<'domicilio' | 'tienda'>('domicilio');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    telefono: '',
    direccion: '',
    referencias: '',
  });

  if (items.length === 0) {
    return (
      <main className={styles.emptyState}>
        <h1>Tu Carrito está Vacío</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Agrega pasteles del catálogo para continuar.</p>
        <Link href="/catalogo" className="btn-primary" style={{ padding: '1rem 2rem' }}>
          Ver Catálogo
        </Link>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        window.location.href = '/checkout/error?reason=no_token';
        return;
      }

      const body = {
        email: formData.email,
        items: items.map(({ pastel, cantidad }) => ({
          pastelId: pastel._id,
          cantidad,
        })),
        metodoEntrega: metodoEntrega === 'domicilio' ? 'DOMICILIO' : 'TIENDA',
        telefono: formData.telefono,
        ...(metodoEntrega === 'domicilio' && { direccionEnvio: formData.direccion }),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = '/checkout/error';
      }
    } catch (error) {
      console.error('[Checkout] Error during submission', error);
      window.location.href = '/checkout/error';
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className={styles.container}>
      <div className={styles.backLink}>
        <Link href="/pedidos">← Mis Pedidos</Link>
      </div>
      <h1 className={styles.title}>Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Datos de Contacto</h2>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Correo electrónico</label>
                  <input
                    name="email" type="email" value={formData.email}
                    onChange={handleChange} required placeholder="tu@correo.com"
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Teléfono</label>
                  <input
                    name="telefono" type="tel" value={formData.telefono}
                    onChange={handleChange} required
                    className={styles.textInput}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Método de Entrega</h2>
              <div className={styles.methodSelector}>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('domicilio')}
                  className={`${styles.methodBtn} ${metodoEntrega === 'domicilio' ? styles.methodBtnActive : ''}`}
                >
                  <div className={styles.methodLabel}>📦 Envío a Domicilio</div>
                  <p className={styles.methodSubtext}>Entrega en tu dirección</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('tienda')}
                  className={`${styles.methodBtn} ${metodoEntrega === 'tienda' ? styles.methodBtnActive : ''}`}
                >
                  <div className={styles.methodLabel}>🏪 Retiro en Tienda</div>
                  <p className={styles.methodSubtext}>Av. Principal #123</p>
                </button>
              </div>

              {metodoEntrega === 'domicilio' && (
                <div className={styles.inputGrid}>
                  <div className={`${styles.inputGroup} ${styles.inputGroupFull}`}>
                    <label className={styles.inputLabel}>Dirección</label>
                    <input
                      name="direccion" value={formData.direccion}
                      onChange={handleChange} required
                      placeholder="Calle, número, colonia"
                      className={styles.textInput}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Referencias</label>
                    <input
                      name="referencias" value={formData.referencias}
                      onChange={handleChange}
                      placeholder="Puerta, timbre, etc."
                      className={styles.textInput}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>Resumen del Pedido</h3>
            <div>
              {items.map(({ pastel, cantidad }) => (
                <div key={pastel._id} className={styles.summaryItem}>
                  <div className={styles.summaryItemImage}>
                    <Image src={pastel.imagen} alt={pastel.nombre} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className={styles.summaryItemInfo}>
                    <p className={styles.summaryItemName}>{pastel.nombre}</p>
                    <p className={styles.summaryItemQty}>x{cantidad}</p>
                  </div>
                  <p className={styles.summaryItemPrice}>${(pastel.precio * cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Subtotal</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Envío</span>
              <span className={styles.summaryShipping}>{metodoEntrega === 'tienda' ? 'Gratis' : 'Calculado'}</span>
            </div>
            <hr className={styles.summaryDivider} />
            <div className={styles.summaryTotalRow}>
              <strong>Total</strong>
              <strong className={styles.summaryTotalAmount}>${total().toFixed(2)}</strong>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitBtn} ${loading ? styles.submitBtnDisabled : ''}`}
            >
              {loading ? 'Procesando...' : 'Pagar con Stripe'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/checkout/checkout.module.css frontend/app/checkout/page.tsx
git commit -m "refactor: extract checkout page inline styles to CSS module"
```

---

### Task 7: Contact page — extract to CSS Module

**Files:**
- Create: `frontend/app/contactenos/contactenos.module.css`
- Modify: `frontend/app/contactenos/page.tsx`

- [ ] **Step 1: Create contactenos.module.css**

```css
.container {
  min-height: 100vh;
  background: var(--gray-light);
}

.hero {
  position: relative;
  height: 50vh;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

@media (max-width: 768px) {
  .hero {
    height: 40vh;
    min-height: 300px;
  }
}

.heroOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
  z-index: 1;
}

.heroContent {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
  max-width: 700px;
  padding: 0 2rem;
}

.heroTitle {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 400;
  margin-bottom: 1rem;
}

.heroText {
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
}

.cardsSection {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .cardsSection {
    padding: 2rem 1rem;
  }
}

.cardsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: -5rem;
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .cardsGrid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: -3rem;
  }
}

.card {
  background: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@media (max-width: 768px) {
  .card {
    padding: 1.5rem;
  }
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.16);
}

.cardIcon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  display: block;
}

.cardTitle {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--dark);
}

.cardText {
  color: var(--gray);
  margin-bottom: 1.5rem;
  line-height: 1.7;
}

.cardLink {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.cardAddress {
  color: var(--gray);
  font-weight: 500;
}

.infoSection {
  padding: 5rem 2rem;
  background: #fff;
}

@media (max-width: 768px) {
  .infoSection {
    padding: 3rem 1rem;
  }
}

.infoContainer {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 3rem;
}

@media (max-width: 768px) {
  .infoContainer {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.infoCard {
  padding: 2.5rem;
  border-radius: 12px;
  background: #faf9f8;
}

@media (max-width: 768px) {
  .infoCard {
    padding: 1.5rem;
  }
}

.infoTitle {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: var(--dark);
}

@media (max-width: 768px) {
  .infoTitle {
    font-size: 1.25rem;
  }
}

.infoText {
  color: var(--gray);
  line-height: 1.8;
  margin-bottom: 1rem;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .infoText {
    font-size: 0.95rem;
  }
}

.infoAccent {
  color: var(--primary);
  font-weight: 600;
}

.ctaSection {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #fdf5f5 0%, #fff 100%);
  text-align: center;
}

@media (max-width: 768px) {
  .ctaSection {
    padding: 3rem 1rem;
  }
}

.ctaTitle {
  font-family: var(--font-serif);
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 1rem;
  color: var(--dark);
}

@media (max-width: 768px) {
  .ctaTitle {
    font-size: 1.5rem;
  }
}

.ctaText {
  color: var(--gray);
  margin-bottom: 2rem;
  line-height: 1.7;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.ctaBtn {
  display: inline-block;
  padding: 1rem 2rem;
  background: var(--primary);
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
}

/* Modal */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modalContent {
  background: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  border: 1px solid #eee;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
  position: relative;
}

.modalCloseBtn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray);
}

.modalTitle {
  font-family: Georgia, serif;
  font-size: 1.75rem;
  font-weight: 400;
  margin-bottom: 1.5rem;
  color: var(--dark);
}

.modalForm {
  display: grid;
  gap: 1.25rem;
}

.formGroup {
  display: grid;
  gap: 0.5rem;
}

.formLabel {
  color: var(--dark);
  font-size: 0.95rem;
  font-weight: 500;
}

.formInput {
  padding: 0.75rem 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  color: var(--dark);
  outline: none;
}

.modalSubmitBtn {
  padding: 0.875rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 0.5rem;
}
```

- [ ] **Step 2: Rewrite contactenos/page.tsx with CSS modules**

Remove `useMediaQuery` import and all inline styles. Replace with CSS module classes.

```tsx
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
        if (!response.ok) throw new Error(result.error || 'Error al enviar el mensaje');
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
            <a href="tel:+50760000000" className={styles.cardLink}>+507 6000-0000</a>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>💬</span>
            <h3 className={styles.cardTitle}>WhatsApp</h3>
            <p className={styles.cardText}>Chatea con nosotros de forma rápida y conveniente.</p>
            <a href="https://wa.me/50760000001" className={styles.cardLink} target="_blank" rel="noopener noreferrer">+507 6000-0001</a>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>✉️</span>
            <h3 className={styles.cardTitle}>Correo Electrónico</h3>
            <p className={styles.cardText}>¿Tienes alguna consulta? Te responderemos pronto.</p>
            <a href="#" onClick={handleEmailClick} className={styles.cardLink}>dolceatelier@gmail.com</a>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>📍</span>
            <h3 className={styles.cardTitle}>Dirección</h3>
            <p className={styles.cardText}>Visítanos en nuestro atelier. Con cita previa.</p>
            <p className={styles.cardAddress}>Calle 50, Paitilla<br />Ciudad de Panamá</p>
            <a href="https://maps.google.com/?q=Calle+50+Paitilla+Ciudad+de+Panama" target="_blank" rel="noopener noreferrer" className={styles.cardLink} style={{ marginTop: '1rem' }}>
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
            <p className={styles.infoAccent}>
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
            <p className={styles.infoText} style={{ marginTop: '1rem' }}>
              Los días festivos puede variar nuestro horario.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>¿Listo para tu pastel perfecto?</h2>
        <p className={styles.ctaText}>Contáctanos para pedidos personalizados o cualquier consulta.</p>
        <Link href="/catalogo" className={styles.ctaBtn}>Ver Catálogo</Link>
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
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/contactenos/contactenos.module.css frontend/app/contactenos/page.tsx
git commit -m "refactor: extract contact page inline styles to CSS module"
```

---

### Task 8: Header — extract to CSS Module

**Files:**
- Create: `frontend/components/header.module.css`
- Modify: `frontend/components/Header.tsx`

- [ ] **Step 1: Create header.module.css**

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
}

@media (max-width: 768px) {
  .header {
    padding: 0.5rem 1rem;
  }
}

.logo {
  font-family: Georgia, serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--dark);
  text-decoration: none;
}

@media (max-width: 768px) {
  .logo {
    font-size: 1.2rem;
  }
}

.logoAccent {
  color: var(--primary);
}

.menuButton {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .menuButton {
    display: block;
  }
}

.mobileActions {
  display: none;
}

@media (max-width: 768px) {
  .mobileActions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

@media (max-width: 768px) {
  .nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: white;
    padding: 1rem;
    gap: 0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    z-index: 999;
  }
}

.navOpen {
  display: flex;
}

.navLink {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--gray);
  text-decoration: none;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

@media (max-width: 768px) {
  .navLink {
    width: 100%;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    text-align: left;
  }
}

.navLink:hover {
  color: var(--primary);
}

.navLinkAccent {
  color: var(--primary);
}

.adminLink {
  font-weight: 500;
  font-size: 0.95rem;
  color: #fff;
  background: var(--primary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
}

@media (max-width: 768px) {
  .adminLink {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

.desktopOnly {
  display: contents;
}

@media (max-width: 768px) {
  .desktopOnly {
    display: none;
  }
}
```

- [ ] **Step 2: Rewrite Header.tsx with CSS modules and useMediaQuery hook**

Replace inline styles with CSS modules. Use the shared `useMobile` hook instead of manual `window.innerWidth` logic.

```tsx
'use client';

import { UserButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { useMobile } from '@/hooks/useMediaQuery';
import styles from './header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { user } = useUser();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const userRole = user?.publicMetadata?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Dolce <span className={styles.logoAccent}>Atelier</span>
      </Link>

      {isMobile && (
        <div className={styles.mobileActions}>
          <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle menu">
            ☰
          </button>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      )}

      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
        <Link href="/catalogo" className={styles.navLink} onClick={closeMenu}>
          Catálogo
        </Link>
        <Link href="/contactenos" className={styles.navLink} onClick={closeMenu}>
          Contáctenos
        </Link>
        <Link href="/sobre-nosotros" className={styles.navLink} onClick={closeMenu}>
          Nosotros
        </Link>
        <Link href="/carrito" className={styles.navLink} onClick={closeMenu}>
          Carrito
        </Link>
        <SignedIn>
          <Link href="/pedidos" className={styles.navLink} onClick={closeMenu}>
            Mis Pedidos
          </Link>
        </SignedIn>
        {isAdmin && (
          <Link href="/admin" className={styles.adminLink} onClick={closeMenu}>
            Panel Admin
          </Link>
        )}
        <SignedOut>
          <Link href="/sign-in" className={`${styles.navLink} ${styles.navLinkAccent}`} onClick={closeMenu}>
            Iniciar Sesión
          </Link>
        </SignedOut>
        {!isMobile && (
          <div className={styles.desktopOnly}>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/header.module.css frontend/components/Header.tsx
git commit -m "refactor: extract header inline styles to CSS module, use centralized useMobile hook"
```

---

### Task 9: Admin Layout — extract to CSS Module

**Files:**
- Create: `frontend/app/admin/admin-layout.module.css`
- Modify: `frontend/app/admin/layout.tsx`

- [ ] **Step 1: Create admin-layout.module.css**

```css
.wrapper {
  display: flex;
  min-height: 100vh;
}

.sidebarToggle {
  position: fixed;
  top: 70px;
  left: 0;
  z-index: 999;
  padding: 0.75rem 1rem;
  background: #1f2937;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  display: none;
}

@media (max-width: 768px) {
  .sidebarToggle {
    display: block;
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 998;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  background: #1f2937;
  color: #fff;
  padding: 2rem 1rem;
  position: relative;
  height: 100vh;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 999;
    padding: 6rem 0.75rem 1rem;
    display: none;
  }
}

.sidebarOpen {
  display: block;
}

.sidebarTitle {
  margin-bottom: 2rem;
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .sidebarTitle {
    font-size: 1rem;
  }
}

.sidebarNav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebarLink {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  color: #fff;
  text-decoration: none;
  font-size: 0.9rem;
  display: block;
}

@media (max-width: 768px) {
  .sidebarLink {
    font-size: 0.85rem;
  }
}

.sidebarLink:hover {
  background: rgba(255,255,255,0.1);
}

.main {
  flex: 1;
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .main {
    padding: 6rem 0.75rem 1rem;
  }
}
```

- [ ] **Step 2: Rewrite admin/layout.tsx with CSS modules**

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMobile } from '@/hooks/useMediaQuery';
import styles from './admin-layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/pasteles', label: 'Catálogo' },
    { href: '/admin/pedidos', label: 'Pedidos' },
    { href: '/admin/recetas', label: 'Recetas' },
    { href: '/admin/usuarios', label: 'Usuarios' },
  ];

  return (
    <div className={styles.wrapper}>
      {isMobile && (
        <button onClick={toggleSidebar} className={styles.sidebarToggle}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {isMobile && sidebarOpen && (
        <div onClick={closeSidebar} className={styles.overlay} />
      )}

      <aside className={`${styles.sidebar} ${isMobile && sidebarOpen ? styles.sidebarOpen : ''}`}>
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
        <nav className={styles.sidebarNav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={styles.sidebarLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/admin-layout.module.css frontend/app/admin/layout.tsx
git commit -m "refactor: extract admin layout inline styles to CSS module"
```

---

### Task 10: Remaining pages — batch CSS Module extraction

**Files to create and modify:**

For each of the following pages, create a CSS module and rewrite the page:

1. `frontend/app/sobre-nosotros/sobre-nosotros.module.css` + `frontend/app/sobre-nosotros/page.tsx`
2. `frontend/app/recetas/recetas.module.css` + `frontend/app/recetas/page.tsx`
3. `frontend/app/not-found.module.css` + `frontend/app/not-found.tsx`
4. `frontend/app/pedidos/pedidos.module.css` + `frontend/app/pedidos/page.tsx`
5. `frontend/app/admin/admin-dashboard.module.css` + `frontend/app/admin/page.tsx`
6. `frontend/app/admin/pasteles/pasteles.module.css` + `frontend/app/admin/pasteles/page.tsx`
7. `frontend/app/admin/pedidos/pedidos.module.css` + `frontend/app/admin/pedidos/page.tsx`
8. `frontend/app/admin/recetas/recetas.module.css` + `frontend/app/admin/recetas/page.tsx`
9. `frontend/app/admin/usuarios/usuarios.module.css` + `frontend/app/admin/usuarios/page.tsx`
10. `frontend/app/checkout/exito/exito.module.css` + `frontend/app/checkout/exito/page.tsx`
11. `frontend/app/checkout/error/error.module.css` + `frontend/app/checkout/error/page.tsx`

**For each page, apply the same pattern:**
1. Read the existing file to understand the inline styles
2. Create the CSS module with responsive breakpoints at 768px where `isMobile` was used
3. Rewrite the TSX to use CSS module classes instead of inline `style={...}`
4. Remove `useMediaQuery` import if it was only used for styles
5. Keep `useMediaQuery` only if used for JS-conditional rendering (like AdminLayout sidebar toggle)

- [ ] **Step 1: Extract sobre-nosotros page**

Create the CSS module following same patterns. Remove useMediaQuery. Keep the page as client component since it doesn't use any hooks after migration? Check - it currently uses `isMobile` from useMediaQuery. All those style differences move to CSS media queries.

```css
/* frontend/app/sobre-nosotros/sobre-nosotros.module.css */
/* Same pattern: extract every style object into a class */
/* Responsive breakpoints at 768px for mobile adaptations */
```

- [ ] **Step 2: Extract recetas page**

- [ ] **Step 3: Extract not-found page**

- [ ] **Step 4: Extract pedidos (client orders) page**

- [ ] **Step 5: Extract admin dashboard page**

- [ ] **Step 6: Extract admin pasteles page**

- [ ] **Step 7: Extract admin pedidos page** (also fix CONFIRMADO → use real backend states)

- [ ] **Step 8: Extract admin recetas page**

- [ ] **Step 9: Extract admin usuarios page**

- [ ] **Step 10: Extract checkout success page**

- [ ] **Step 11: Extract checkout error page**

- [ ] **Step 12: Commit all remaining pages**

```bash
git add frontend/app/
git commit -m "refactor: extract all remaining page inline styles to CSS modules"
```

---

### Task 11: Admin Pedidos — fix CONFIRMADO state filter

**Files:**
- Modify: `frontend/app/admin/pedidos/page.tsx`

- [ ] **Step 1: Replace CONFIRMADO with real backend states (PREPARANDO, LISTO, EN_CAMINO)**

In the filters and dropdown, replace:
```
<option value="CONFIRMADO">Confirmado</option>
```
with:
```
<option value="PAGADO">Pagado</option>
<option value="PREPARANDO">Preparando</option>
<option value="LISTO">Listo</option>
<option value="EN_CAMINO">En camino</option>
```

Also update `estadoColors` record.

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/pedidos/page.tsx
git commit -m "fix: replace CONFIRMADO state with real backend pedido states"
```

---

### Task 12: Backend — remove debug logs from pedidos.ts

**Files:**
- Modify: `backend/src/routes/pedidos.ts`

- [ ] **Step 1: Remove verbose console.log lines from POST /api/pedidos handler**

Remove lines 56-64, 67-71, 74-77, 91, 93-97, 100-105. Keep only the functional logic.

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/pedidos.ts
git commit -m "fix: remove verbose debug logs from pedidos route"
```

---

### Task 13: Backend — fix hardcoded seed path

**Files:**
- Modify: `backend/src/seed.ts`

- [ ] **Step 1: Replace absolute path with path.join relative to project**

Change line 7 from:
```ts
const IMAGENES_DIR = 'C:/Users/ELI_BENDECIDA/Desktop/UTP-2026/parcial_1/frontend/public/images/catalogo';
```
to:
```ts
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IMAGENES_DIR = join(__dirname, '..', '..', '..', 'frontend', 'public', 'images', 'catalogo');
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/seed.ts
git commit -m "fix: replace hardcoded seed path with relative path"
```

---

### Task 14: Clean up dead components

**Files:**
- Delete: `frontend/components/AdminSidebar.tsx`
- Delete: `frontend/components/ProtectedRoute.tsx`
- Delete: `frontend/components/DataTable.tsx`

- [ ] **Step 1: Remove dead components**

```bash
git rm frontend/components/AdminSidebar.tsx frontend/components/ProtectedRoute.tsx frontend/components/DataTable.tsx
git commit -m "chore: remove unused components (AdminSidebar, ProtectedRoute, DataTable)"
```

---

### Task 15: Add SEO metadata to pages that lack it

**Files:**
- Modify: `frontend/app/catalogo/page.tsx`, `frontend/app/carrito/page.tsx`, `frontend/app/checkout/page.tsx`, `frontend/app/pedidos/page.tsx`, `frontend/app/contactenos/page.tsx`, `frontend/app/sobre-nosotros/page.tsx`, `frontend/app/admin/page.tsx`

**Note:** Client components cannot export metadata directly. For pages that must remain `'use client'` (due to hooks), the metadata must be extracted to a `layout.tsx` in the same directory, OR we can use the `generateMetadata` on a server component wrapper.

A simpler approach: add a `layout.tsx` to each route that's a server component with metadata, while the `page.tsx` remains a client component.

- [ ] **Step 1: Add metadata via layouts for client pages**

For each client page directory, add a `layout.tsx` with metadata:

**Example for catalogo:**
```tsx
// frontend/app/catalogo/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo - Dolce Atelier',
  description: 'Explora nuestra selección de pasteles artesanales: chocolate, vainilla, frutas y más.',
};
```

Do the same for carrito, checkout, pedidos, contactenos, sobre-nosotros, admin.

- [ ] **Step 2: Commit**

```bash
git add frontend/app/catalogo/layout.tsx frontend/app/carrito/layout.tsx frontend/app/checkout/layout.tsx frontend/app/pedidos/layout.tsx frontend/app/contactenos/layout.tsx frontend/app/sobre-nosotros/layout.tsx frontend/app/admin/layout.tsx
git commit -m "feat: add SEO metadata to all pages"
```

---

### Task 16: Final verification — build and lint

- [ ] **Step 1: Run TypeScript check and build**

```bash
cd frontend; npm run build
```

Fix any type errors or build failures.

- [ ] **Step 2: Run lint**

```bash
cd frontend; npm run lint
```

Fix any lint warnings.

- [ ] **Step 3: Commit final fixes if needed**

```bash
git add -A
git commit -m "fix: resolve build and lint issues after refactor"
```

---

### Task 17: Update frontend/package.json with build scripts (if needed)

No changes needed — `npm run build` and `npm run lint` are already configured.
