"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getRecetas, updateReceta } from "@/lib/adminApi";
import type { Receta } from "@/lib/adminApi";
import styles from "./recetas.module.css";

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
      <h1 className={styles.title}>Gestión de Recetas</h1>

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
