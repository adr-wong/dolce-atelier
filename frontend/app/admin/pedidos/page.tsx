"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getPedidos, updatePedidoStatus } from "@/lib/adminApi";
import type { Pedido } from "@/lib/adminApi";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./pedidos.module.css";

interface PedidoItem {
  nombre?: string;
  precioSnapshot?: number;
  cantidad?: number;
}

export default function AdminPedidos() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [statusChange, setStatusChange] = useState<{ id: string; newStatus: string } | null>(null);

  useEffect(() => {
    async function loadPedidos() {
      try {
        const token = await getToken();
        const status = filtroEstado || undefined;
        const result = await getPedidos(token!, { status, page: currentPage, limit });
        setPedidos(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          console.error("Offline:", error);
        } else {
          console.error("Error loading pedidos:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPedidos();
  }, [getToken, filtroEstado, currentPage, limit]);

  const handleFiltroChange = (value: string) => {
    setFiltroEstado(value);
    setCurrentPage(1);
  };

  const confirmChange = async (id: string, newStatus: string) => {
    try {
      const token = await getToken();
      await updatePedidoStatus(token!, id, newStatus);
      setPedidos(pedidos.map(p => p._id === id ? { ...p, estado: newStatus } : p));
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
      } else {
        const message = error instanceof Error ? error.message : "Error updating status";
        alert(message);
        console.error("Error updating status:", error);
      }
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const pedido = pedidos.find(p => p._id === id);
    if (
      newStatus === "CANCELADO" ||
      (pedido && pedido.estado === "PENDIENTE" && newStatus !== "PENDIENTE")
    ) {
      setStatusChange({ id, newStatus });
    } else {
      confirmChange(id, newStatus);
    }
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: "#fef3c7",
    PREPARANDO: "#fef3c7",
    LISTO: "#dcfce7",
    EN_CAMINO: "#e0e7ff",
    PAGADO: "#dbeafe",
    ENTREGADO: "#f3e8ff",
    CANCELADO: "#fee2e2",
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.title}>
        <h1>Gestión de Pedidos</h1>
        <select
          value={filtroEstado}
          onChange={(e) => handleFiltroChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PREPARANDO">Preparando</option>
          <option value="LISTO">Listo</option>
          <option value="EN_CAMINO">En camino</option>
          <option value="PAGADO">Pagado</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
        <thead>
          <tr className={styles.theadTr}>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>Fecha</th>
            <th className={styles.th}>Total</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido._id} className={styles.tr}>
              <td className={styles.td}>
                <button
                  type="button"
                  className={styles.orderIdButton}
                  onClick={() => setDetailPedido(pedido)}
                >
                  #{pedido._id}
                </button>
              </td>
              <td className={styles.td}>
                {new Date(pedido.createdAt).toLocaleDateString()}
              </td>
              <td className={styles.td}>${pedido.total}</td>
              <td className={styles.td}>
                <span
                  className={styles.statusBadge}
                  style={{
                    background: estadoColors[pedido.estado] || "#f3f4f6",
                  }}
                >
                  {pedido.estado.replace('_', ' ')}
                </span>
              </td>
              <td className={styles.td}>
                <select
                  value={pedido.estado}
                  onChange={(e) => handleStatusChange(pedido._id, e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PREPARANDO">Preparando</option>
                  <option value="LISTO">Listo</option>
                  <option value="EN_CAMINO">En camino</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {detailPedido && (
        <div className={styles.modalOverlay} onClick={() => setDetailPedido(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Pedido #{detailPedido._id}</h2>
              <span
                className={styles.statusBadge}
                style={{ background: estadoColors[detailPedido.estado] || "#f3f4f6" }}
              >
                {detailPedido.estado.replace('_', ' ')}
              </span>
            </div>

            <div className={styles.orderDetailSection}>
              <h4>Información de entrega</h4>
              <div className={styles.orderInfo}>
                <p>Método: {detailPedido.metodoEntrega === 'delivery' ? '🏠 A domicilio' : '🏪 Retirar en tienda'}</p>
                {detailPedido.direccionEnvio && <p>Dirección: {detailPedido.direccionEnvio}</p>}
                <p>Fecha: {new Date(detailPedido.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className={styles.orderDetailSection}>
              <h4>Items</h4>
              <div className={styles.orderItems}>
                {(detailPedido.items as PedidoItem[]).map((item, i) => {
                  const precio = item.precioSnapshot ?? 0;
                  const cantidad = item.cantidad ?? 1;
                  const subtotal = precio * cantidad;
                  return (
                    <div key={i} className={styles.orderItem}>
                      <div className={styles.orderItemTop}>
                        <span className={styles.orderItemName}>{item.nombre ?? 'Producto'}</span>
                        <span className={styles.orderItemPrice}>${precio.toFixed(2)}</span>
                      </div>
                      <div className={styles.orderItemBottom}>
                        <span>{cantidad} x ${precio.toFixed(2)}</span>
                        <span>= ${subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.orderTotal}>
              Total: ${detailPedido.total.toFixed(2)}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setDetailPedido(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!statusChange}
        title="Cambiar estado"
        message={`¿Confirmas cambiar el estado del pedido a ${statusChange?.newStatus}?`}
        confirmLabel="Confirmar"
        variant={statusChange?.newStatus === "CANCELADO" ? "danger" : "info"}
        onConfirm={() => {
          if (statusChange) confirmChange(statusChange.id, statusChange.newStatus);
          setStatusChange(null);
        }}
        onCancel={() => setStatusChange(null)}
      />
    </div>
  );
}
