"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { toast } from "sonner";
import { getRecetas, updateReceta } from "@/lib/adminApi";
import type { Receta } from "@/lib/adminApi";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import CotizarModal from "./cotizar-modal";
import styles from "@/styles/admin/shared.module.css";

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "#fef3c7",
  REVISANDO: "#dbeafe",
  COTIZADA: "#f3e8ff",
  ACEPTADA: "#dcfce7",
  RECHAZADA: "#fee2e2",
};

export default function AdminRecetas() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);

  const loadRecetas = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getRecetas(token, { page: currentPage, limit });
      setRecetas(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error loading recetas:", error);
        toast.error("Error al cargar recetas");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, currentPage, limit]);

  useEffect(() => { loadRecetas(); }, [loadRecetas]);

  const handleCotizar = async (id: string, cotizacion: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      await updateReceta(token, id, { cotizacion, estado: "COTIZADA" });
      setRecetas(recetas.map(r => r._id === id ? { ...r, cotizacion, estado: "COTIZADA" } : r));
      toast.success("Cotización enviada");
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        toast.error("Sin conexión a internet");
      } else {
        toast.error("Error al cotizar");
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

  if (loading) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gestión de Recetas</h1>
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  const badgeStyle = (estado: string) => ({
    padding: "0.2rem 0.65rem",
    borderRadius: 8,
    fontSize: "0.78rem",
    fontWeight: 500,
    background: ESTADO_COLORS[estado] || "#f3f4f6",
    color: "#374151",
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Recetas</h1>
      </div>

      {recetas.length === 0 ? (
        <EmptyState icon="📝" title="No hay recetas" description="Aún no se han solicitado recetas personalizadas" />
      ) : (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrapper} style={{ flex: 1, overflow: 'hidden' }}>
            <table className={styles.desktopTable}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>ID</th>
                  <th>Nota</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Cotización</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {recetas.map((receta) => (
                  <tr key={receta._id} className={styles.tableRow}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#9ca3af" }}>
                      #{typeof receta._id === 'string' ? receta._id.slice(-6) : receta._id}
                    </td>
                    <td style={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {receta.nota || '—'}
                    </td>
                    <td>{new Date(receta.createdAt).toLocaleDateString()}</td>
                    <td><span style={badgeStyle(receta.estado)}>{receta.estado}</span></td>
                    <td style={{ fontWeight: 600 }}>
                      {receta.cotizacion ? `$${receta.cotizacion.toFixed(2)}` : "—"}
                    </td>
                    <td>
                      <button
                        className={styles.btnPrimary}
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
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

          {/* Mobile cards */}
          <div className={styles.mobileCards}>
            {recetas.map((receta) => (
              <div key={receta._id} className={styles.card}>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>ID</span>
                  <span className={styles.cardValue} style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    #{typeof receta._id === 'string' ? receta._id.slice(-6) : receta._id}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Nota</span>
                  <span className={styles.cardValue}>{(receta.nota || '—').length > 60 ? receta.nota!.substring(0, 60) + "..." : receta.nota || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Fecha</span>
                  <span className={styles.cardValue}>{new Date(receta.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Estado</span>
                  <span style={badgeStyle(receta.estado)}>{receta.estado}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Cotización</span>
                  <span className={styles.cardValue} style={{ fontWeight: 600 }}>
                    {receta.cotizacion ? `$${receta.cotizacion.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => openModal(receta)} style={{ background: "#e11d48", color: "#fff", border: "none" }}>
                    💰 Cotizar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Cotizar modal */}
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
