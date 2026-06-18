"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPedidos, updatePedidoStatus } from "@/lib/adminApi";
import type { Pedido } from "@/lib/adminApi";
import styles from "./pedidos.module.css";

export default function AdminPedidos() {
  const { getToken } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("");

  useEffect(() => {
    async function loadPedidos() {
      try {
        const token = await getToken();
        if (!token) return;
        const status = filtroEstado || undefined;
        const data = await getPedidos(token, { status });
        setPedidos(data);
      } catch (error) {
        console.error("Error loading pedidos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPedidos();
  }, [getToken, filtroEstado]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await updatePedidoStatus(token, id, status);
      setPedidos(pedidos.map(p => p._id === id ? { ...p, estado: status } : p));
    } catch (error) {
      console.error("Error updating status:", error);
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
    <div>
      <div className={styles.title}>
        <h1>Gestión de Pedidos</h1>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
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
              <td className={styles.td}>#{pedido._id}</td>
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
  );
}
