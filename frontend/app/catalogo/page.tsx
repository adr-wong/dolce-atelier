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

  const getPastelesFiltrados = () => {
    if (!datos || !datos.pasteles) return [];
    return datos.pasteles.filter((p) => p.disponible);
  };

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
    <main
      className={`${styles.container} ${isPending ? styles.pending : ''}`}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Nuestro Catálogo</h1>
        <Link href="/carrito" className={styles.cartLink}>
          🛒 Carrito
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </Link>
      </div>

      <div className={styles.tabsContainer}>
        {CATEGORIAS.map(cat => {
          const isActive = categoria === cat || (cat === 'todos' && categoria === 'todos');
          return (
            <Link
              key={cat}
              href={cat === 'todos' ? '/catalogo?page=1' : `/catalogo?categoria=${cat}&page=1`}
              className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
            >
              {cat === 'todos' ? 'Todos' : cat}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Cargando pasteles...</p>
        </div>
      ) : getPastelesFiltrados().length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>No hay pasteles disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {getPastelesFiltrados().map(pastel => (
            <div key={pastel._id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={pastel.imagen}
                  alt={pastel.nombre}
                  fill
                  className={styles.image}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.nombre}>{pastel.nombre}</h3>
                <p className={styles.descripcion}>{pastel.descripcion}</p>
                <div className={styles.actions}>
                  <span className={styles.precio}>${pastel.precio}</span>
                  <button
                    onClick={() => handleAgregar(pastel)}
                    className={styles.addButton}
                  >
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
          {Array.from({ length: datos.totalPages || 0 }, (_, i) => i + 1).map(num => {
            const isActive = datos.page === num;
            return (
              <button
                key={num}
                onClick={() => cambiarPagina(num)}
                className={`${styles.pageButton} ${isActive ? styles.pageButtonActive : styles.pageButtonInactive}`}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
