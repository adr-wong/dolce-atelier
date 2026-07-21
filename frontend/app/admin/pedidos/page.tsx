"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { toast } from "sonner";
import { getPedidos, updatePedidoStatus } from "@/lib/adminApi";
import type { Pedido } from "@/lib/adminApi";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "@/styles/admin/shared.module.css";

const ESTADO_OPTIONS = ["PENDIENTE", "PREPARANDO", "LISTO", "EN_CAMINO", "PAGADO", "ENTREGADO", "CANCELADO"];

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "#fef3c7",
  PREPARANDO: "#fef3c7",
  LISTO: "#dcfce7",
  EN_CAMINO: "#e0e7ff",
  PAGADO: "#dbeafe",
  ENTREGADO: "#f3e8ff",
  CANCELADO: "#fee2e2",
};

export default function AdminPedidos() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [statusChange, setStatusChange] = useState<{ id: string; newStatus: string } | null>(null);

  const loadPedidos = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const status = filtroEstado || undefined;
      const result = await getPedidos(token, { status, page: currentPage, limit });
      setPedidos(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error loading pedidos:", error);
        toast.error("Error al cargar pedidos");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, filtroEstado, currentPage, limit]);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  const handleStatusChange = async () => {
    if (!statusChange) return;
    try {
      const token = await getToken();
      if (!token) return;
      await updatePedidoStatus(token, statusChange.id, statusChange.newStatus);
      setPedidos(pedidos.map((p) => (p._id === statusChange.id ? { ...p, estado: statusChange.newStatus } : p)));
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setStatusChange(null);
    }
  };

  const handleStatusSelect = (id: string, newStatus: string) => {
    const pedido = pedidos.find((p) => p._id === id);
    if (newStatus === "CANCELADO" || (pedido && pedido.estado === "PENDIENTE" && newStatus !== "PENDIENTE")) {
      setStatusChange({ id, newStatus });
    } else {
      confirmChange(id, newStatus);
    }
  };

  const confirmChange = async (id: string, newStatus: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await updatePedidoStatus(token, id, newStatus);
      setPedidos(pedidos.map((p) => (p._id === id ? { ...p, estado: newStatus } : p)));
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  if (loading) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gestión de Pedidos</h1>
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

  const selectStyle: React.CSSProperties = {
    padding: "0.4rem 0.5rem",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    fontSize: "0.8rem",
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Pedidos</h1>
      </div>

      <div className={styles.toolbar}>
        <select className={styles.filterSelect} value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setCurrentPage(1); }}>
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map((e) => (
            <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase().replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {pedidos.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No hay pedidos"
          description={filtroEstado ? "Prueba con otro filtro de estado" : "Aún no se han recibido pedidos"}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrapper} style={{ flex: 1, overflow: 'hidden' }}>
            <table className={styles.desktopTable}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {pedidos.map((pedido) => (
                  <tr key={pedido._id} className={styles.tableRow}>
                    <td>
                      <button
                        onClick={() => setDetailPedido(pedido)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#e11d48", fontWeight: 500, fontSize: "0.9rem", padding: 0, textDecoration: "underline" }}
                      >
                        #{typeof pedido._id === 'string' ? pedido._id.slice(-8) : pedido._id}
                      </button>
                    </td>
                    <td>{new Date(pedido.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>${pedido.total?.toFixed(2)}</td>
                    <td><span style={badgeStyle(pedido.estado)}>{pedido.estado.replace('_', ' ')}</span></td>
                    <td>
                      <select
                        style={selectStyle}
                        value={pedido.estado}
                        onChange={(e) => handleStatusSelect(pedido._id, e.target.value)}
                      >
                        {ESTADO_OPTIONS.map((e) => (<option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase().replace('_', ' ')}</option>))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.mobileCards}>
            {pedidos.map((pedido) => (
              <div key={pedido._id} className={styles.card}>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Pedido</span>
                  <button
                    onClick={() => setDetailPedido(pedido)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#e11d48", fontWeight: 500, fontSize: "0.85rem", padding: 0 }}
                  >
                    #{typeof pedido._id === 'string' ? pedido._id.slice(-8) : pedido._id}
                  </button>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Fecha</span>
                  <span className={styles.cardValue}>{new Date(pedido.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Total</span>
                  <span className={styles.cardValue} style={{ fontWeight: 600 }}>${pedido.total?.toFixed(2)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Estado</span>
                  <span style={badgeStyle(pedido.estado)}>{pedido.estado.replace('_', ' ')}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Cambiar</span>
                  <select
                    style={selectStyle}
                    value={pedido.estado}
                    onChange={(e) => handleStatusSelect(pedido._id, e.target.value)}
                  >
                    {ESTADO_OPTIONS.map((e) => (<option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase().replace('_', ' ')}</option>))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Order detail modal */}
      {detailPedido && (
        <div className={styles.modalOverlay} onClick={() => setDetailPedido(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className={styles.modalTitle} style={{ marginBottom: 0 }}>
                Pedido #{typeof detailPedido._id === 'string' ? detailPedido._id.slice(-8) : detailPedido._id}
              </h2>
              <span style={badgeStyle(detailPedido.estado)}>{detailPedido.estado.replace('_', ' ')}</span>
            </div>

            <div className={styles.orderDetailSection}>
              <h4>Información</h4>
              <div style={{ fontSize: "0.88rem", color: "#666" }}>
                <p>Fecha: {new Date(detailPedido.createdAt).toLocaleString()}</p>
                <p>Método de entrega: {detailPedido.metodoEntrega === 'DOMICILIO' ? '🏠 A domicilio' : '🏪 Retirar en tienda'}</p>
                {detailPedido.direccionEnvio && <p>Dirección: {detailPedido.direccionEnvio}</p>}
              </div>
            </div>

            <div className={styles.orderDetailSection}>
              <h4>Items ({detailPedido.items?.length || 0})</h4>
              <div className={styles.orderItems}>
                {(detailPedido.items || []).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{item.nombre}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>${(item.precioSnapshot || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                      <span>{item.cantidad} x ${(item.precioSnapshot || 0).toFixed(2)}</span>
                      <span>= ${((item.precioSnapshot || 0) * (item.cantidad || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
              Total: ${detailPedido.total?.toFixed(2)}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setDetailPedido(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Status change confirmation */}
      <ConfirmDialog
        open={!!statusChange}
        title="Cambiar estado"
        message={`¿Confirmas cambiar el estado del pedido a ${statusChange?.newStatus?.replace('_', ' ')}?`}
        confirmLabel="Confirmar"
        variant={statusChange?.newStatus === "CANCELADO" ? "danger" : "info"}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusChange(null)}
      />
    </div>
  );
}
