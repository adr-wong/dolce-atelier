"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getRecetas, updateReceta } from "@/lib/adminApi";
import type { Receta } from "@/lib/adminApi";

export default function AdminRecetas() {
  const { getToken } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecetas() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getRecetas(token);
        setRecetas(data);
      } catch (error) {
        console.error("Error loading recetas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecetas();
  }, [getToken]);

  const handleCotizar = async (id: string, cotizacion: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      await updateReceta(token, id, { cotizacion, estado: "COTIZADA" });
      setRecetas(recetas.map(r => r._id === id ? { ...r, cotizacion, estado: "COTIZADA" } : r));
    } catch (error) {
      console.error("Error cotizando:", error);
    }
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: "#fef3c7",
    REVISANDO: "#dbeafe",
    COTIZADA: "#f3e8ff",
    ACEPTADA: "#dcfce7",
    RECHAZADA: "#fee2e2",
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Gestión de Recetas</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            <th style={{ padding: "1rem", textAlign: "left" }}>ID</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Nota</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Fecha</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Estado</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Cotización</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {recetas.map((receta) => (
            <tr key={receta._id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>#{receta._id}</td>
              <td style={{ padding: "1rem" }}>{receta.nota.substring(0, 50)}...</td>
              <td style={{ padding: "1rem" }}>
                {new Date(receta.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: "1rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    background: estadoColors[receta.estado] || "#f3f4f6",
                    color: "#374151",
                  }}
                >
                  {receta.estado}
                </span>
              </td>
              <td style={{ padding: "1rem" }}>
                {receta.cotizacion ? `$${receta.cotizacion}` : "—"}
              </td>
              <td style={{ padding: "1rem" }}>
                <button
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const precio = prompt("Ingrese cotización:");
                    if (precio) handleCotizar(receta._id, parseFloat(precio));
                  }}
                >
                  Cotizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}