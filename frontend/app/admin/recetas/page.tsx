"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getRecetas, updateReceta } from "@/lib/adminApi";
import type { Receta } from "@/lib/adminApi";
import CotizarModal from "./cotizar-modal";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Pagination from "@/components/Pagination";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import styles from "./recetas.module.css";

export default function AdminRecetas() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadRecetas() {
      try {
        const token = await getToken();
        const result = await getRecetas(token!, { page: currentPage, limit });
        setRecetas(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          console.error("Offline:", error);
        } else {
          console.error("Error loading recetas:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadRecetas();
  }, [getToken, currentPage, limit]);

  const handleCotizar = async (id: string, cotizacion: number) => {
    try {
      const token = await getToken();
      await updateReceta(token!, id, { cotizacion, estado: "COTIZADA" });
      setRecetas(recetas.map(r => r._id === id ? { ...r, cotizacion, estado: "COTIZADA" } : r));
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
      } else {
        console.error("Error cotizando:", error);
      }
    }
  };

  const openModal = (receta: Receta) => {
    setSelectedReceta(receta);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedReceta(null);
    setModalOpen(false);
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: "#fef3c7",
    REVISANDO: "#dbeafe",
    COTIZADA: "#f3e8ff",
    ACEPTADA: "#dcfce7",
    RECHAZADA: "#fee2e2",
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h1 className={styles.title}>Gestión de Recetas</h1>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  if (recetas.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h1 className={styles.title}>Gestión de Recetas</h1>
        <EmptyState
          icon="📝"
          title="No hay recetas"
          description="Aún no se han solicitado recetas personalizadas"
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 className={styles.title}>Gestión de Recetas</h1>

      {isMobile ? (
        <div className={styles.mobileCards}>
          {recetas.map((receta) => (
            <div key={receta._id} className={styles.card}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>ID</span>
                <span className={styles.cardValue}>#{receta._id}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Nota</span>
                <span className={styles.cardValue}>{receta.nota ? receta.nota.substring(0, 60) + (receta.nota.length > 60 ? '...' : '') : '—'}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Fecha</span>
                <span className={styles.cardValue}>
                  {new Date(receta.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Estado</span>
                <span
                  className={styles.statusBadge}
                  style={{ background: estadoColors[receta.estado] || "#f3f4f6" }}
                >
                  {receta.estado}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Cotización</span>
                <span className={styles.cardValue}>
                  {receta.cotizacion ? `$${receta.cotizacion}` : "—"}
                </span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.cotizarBtn}
                  onClick={() => openModal(receta)}
                >
                  Cotizar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadTr}>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Nota</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Cotización</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((receta) => (
                <tr key={receta._id} className={styles.tr}>
                  <td className={styles.td}>#{receta._id}</td>
                  <td className={styles.td}>{receta.nota ? receta.nota.substring(0, 50) + '...' : '—'}</td>
                  <td className={styles.td}>
                    {new Date(receta.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.td}>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: estadoColors[receta.estado] || "#f3f4f6",
                      }}
                    >
                      {receta.estado}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {receta.cotizacion ? `$${receta.cotizacion}` : "—"}
                  </td>
                  <td className={styles.td}>
                    <button
                      className={styles.cotizarBtn}
                      onClick={() => openModal(receta)}
                    >
                      Cotizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {selectedReceta && (
        <CotizarModal
          isOpen={modalOpen}
          onClose={closeModal}
          onConfirm={(cotizacion) => handleCotizar(selectedReceta._id, cotizacion)}
          recetaId={selectedReceta._id}
          recetaNota={selectedReceta.nota || ''}
        />
      )}
    </div>
  );
}
