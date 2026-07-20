"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getDashboardStats, type DashboardStats } from "@/lib/adminApi";
import StatusBadge from "@/components/StatusBadge";
import styles from "./admin-dashboard.module.css";

const STATUS_COLOR_MAP: Record<string, string> = {
  PENDIENTE: "#fef3c7",
  CONFIRMADO: "#dcfce7",
  PAGADO: "#dbeafe",
  ENTREGADO: "#f3e8ff",
  CANCELADO: "#fee2e2",
};

const STATUS_DOT_MAP: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  CONFIRMADO: "#10b981",
  PAGADO: "#3b82f6",
  ENTREGADO: "#8b5cf6",
  CANCELADO: "#ef4444",
};

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

  const recentPedidos = (stats as any).recentPedidos as unknown[] | undefined;
  const statusBreakdown = (stats as any).statusBreakdown as Record<string, number> | undefined;

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

      <div className={styles.panelsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Pedidos Recientes</div>
          <div className={styles.panelBody}>
            {!recentPedidos || recentPedidos.length === 0 ? (
              <div className={styles.emptyPanel}>No hay pedidos recientes</div>
            ) : (
              recentPedidos.map((pedido: any, i: number) => (
                <div key={pedido._id || i} className={styles.recentRow}>
                  <div className={styles.recentLeft}>
                    <span className={styles.recentId}>
                      #{typeof pedido._id === "string" ? pedido._id.slice(-6) : pedido._id}
                    </span>
                    <span className={styles.recentDate}>
                      {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : ""} · {pedido.items?.length || 0} item{(pedido.items?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <StatusBadge status={pedido.estado} colorMap={STATUS_COLOR_MAP} />
                    <span className={styles.recentTotal}>${pedido.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>Estado de Pedidos</div>
          <div className={styles.statusList}>
            {statusBreakdown && Object.keys(statusBreakdown).length > 0 ? (
              Object.entries(statusBreakdown).map(([status, count]) => {
                const maxCount = Math.max(...Object.values(statusBreakdown), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={status} className={styles.statusRow}>
                    <span>
                      <span
                        className={styles.statusDot}
                        style={{ background: STATUS_DOT_MAP[status] || "#9ca3af" }}
                      />
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <div className={styles.statusBar}>
                      <div
                        className={styles.statusBarFill}
                        style={{ width: `${pct}%`, background: STATUS_DOT_MAP[status] || "#9ca3af" }}
                      />
                    </div>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyPanel}>Sin datos de pedidos</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
