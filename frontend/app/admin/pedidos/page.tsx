"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPedidos, updatePedidoStatus } from "@/lib/adminApi";
import type { Pedido } from "@/lib/adminApi";

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
    CONFIRMADO: "#dcfce7",
    PAGADO: "#dbeafe",
    ENTREGADO: "#f3e8ff",
    CANCELADO: "#fee2e2",
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Gestión de Pedidos</h1>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ marginTop: "1rem", padding: "0.5rem", borderRadius: "6px" }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="PAGADO">Pagado</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            <th style={{ padding: "1rem", textAlign: "left" }}>ID</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Fecha</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Total</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Estado</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido._id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>#{pedido._id}</td>
              <td style={{ padding: "1rem" }}>
                {new Date(pedido.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: "1rem" }}>${pedido.total}</td>
              <td style={{ padding: "1rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    background: estadoColors[pedido.estado] || "#f3f4f6",
                    color: "#374151",
                  }}
                >
                  {pedido.estado}
                </span>
              </td>
              <td style={{ padding: "1rem" }}>
                <select
                  value={pedido.estado}
                  onChange={(e) => handleStatusChange(pedido._id, e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
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