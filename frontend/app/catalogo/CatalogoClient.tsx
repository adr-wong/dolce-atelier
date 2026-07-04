'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { useCarritoStore } from '@/store/carrito';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Pastel } from '@/lib/types';
import styles from './catalogo.module.css';

import { getApiUrl } from '@/lib/get-api-url';

const CATEGORIAS = ['todos', 'chocolate', 'vainilla', 'frutas', 'especial'];
const ORDEN_OPCIONES = [
  { value: 'createdAt-desc', label: 'Más recientes' },
  { value: 'createdAt-asc', label: 'Más antiguos' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre-asc', label: 'Nombre: A-Z' },
  { value: 'nombre-desc', label: 'Nombre: Z-A' },
];

interface CatalogoDatos {
  pasteles: Pastel[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CatalogoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoria = searchParams.get('categoria') || 'todos';
  const page = parseInt(searchParams.get('page') || '1');

  const agregar = useCarritoStore(s => s.agregar);
  const items = useCarritoStore(s => s.items);
  const [datos, setDatos] = useState<CatalogoDatos | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // HU-029: búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // HU-030: filtro por rango de precio
  const [precioMin, setPrecioMin] = useState(searchParams.get('precioMin') || '');
  const [precioMax, setPrecioMax] = useState(searchParams.get('precioMax') || '');

  // HU-031: ordenamiento
  const [ordenValue, setOrdenValue] = useState(
    `${searchParams.get('ordenarPor') || 'createdAt'}-${searchParams.get('orden') || 'desc'}`
  );

  // Debounce búsqueda: 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar pasteles
  useEffect(() => {
    async function cargarPasteles() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '12');
        if (categoria !== 'todos') params.set('categoria', categoria);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (precioMin) params.set('precioMin', precioMin);
        if (precioMax) params.set('precioMax', precioMax);

        const [ordenarPor, orden] = ordenValue.split('-');
        params.set('ordenarPor', ordenarPor);
        params.set('orden', orden);

        const res = await fetch(`${getApiUrl()}/api/pasteles?${params.toString()}`);
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
  }, [categoria, page, debouncedSearch, precioMin, precioMax, ordenValue]);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

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

  const aplicarFiltros = () => {
    startTransition(() => {
      // forces re-fetch via state change handled by useEffect
    });
  };

  return (
    <main className={`${styles.container} ${isPending ? styles.pending : ''}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Nuestro Catálogo</h1>
        <Link href="/carrito" className={styles.cartLink}>
          🛒 Carrito
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </Link>
      </div>

      {/* Categorías */}
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

      {/* HU-029: Búsqueda por nombre + HU-030: Filtro precio + HU-031: Orden */}
      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Buscar pasteles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.priceFilter}>
          <input
            type="number"
            placeholder="Precio min"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className={styles.priceInput}
            min="0"
          />
          <span className={styles.priceSeparator}>—</span>
          <input
            type="number"
            placeholder="Precio max"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className={styles.priceInput}
            min="0"
          />
        </div>

        <select
          value={ordenValue}
          onChange={(e) => setOrdenValue(e.target.value)}
          className={styles.sortSelect}
        >
          {ORDEN_OPCIONES.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Cargando pasteles...</p>
        </div>
      ) : datos && datos.pasteles.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>No hay pasteles que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {datos?.pasteles.map(pastel => (
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
