"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getDashboardStats, type DashboardStats } from "@/lib/adminApi";
import styles from "./admin-dashboard.module.css";

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    totalRecetas: 0,
    totalPasteles: 0,
    ingresosMes: 0,
    recentPedidos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const token = await getToken();
        const data = await getDashboardStats(token!);
        setStats(data);
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          console.error("Offline:", error);
        } else {
          console.error("Error loading stats:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [getToken]);

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  const statsData = [
    { label: "Pedidos Hoy", value: stats.totalPedidos, color: "#3b82f6" },
    { label: "Recetas Pendientes", value: stats.totalRecetas, color: "#f59e0b" },
    { label: "Productos", value: stats.totalPasteles, color: "#10b981" },
    { label: "Ingresos del Mes", value: `$${stats.ingresosMes.toFixed(2)}`, color: "#8b5cf6" },
  ];

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.statsGrid}>
        {statsData.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue} style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
