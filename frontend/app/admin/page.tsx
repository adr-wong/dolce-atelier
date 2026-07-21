"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getDashboardStats } from "@/lib/adminApi";
import type { DashboardStats } from "@/lib/adminApi";
import styles from "@/styles/admin/dashboard.module.css";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const STATUS_MAP: Record<string, string> = {
  PENDIENTE: '#fef3c7',
  CONFIRMADO: '#dcfce7',
  PAGADO: '#dbeafe',
  ENTREGADO: '#f3e8ff',
  CANCELADO: '#fee2e2',
};

const STATUS_DOT_MAP: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  CONFIRMADO: '#10b981',
  PAGADO: '#3b82f6',
  ENTREGADO: '#8b5cf6',
  CANCELADO: '#ef4444',
};

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    totalRecetas: 0,
    totalPasteles: 0,
    pedidosPendientes: 0,
    totalIngresos: 0,
    statusBreakdown: {},
    recentPedidos: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getDashboardStats(token);
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

  if (loading) {
    return (
      <div>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <LoadingSkeleton type="cards" />
      </div>
    );
  }

  const statsData = [
    { label: "Productos", value: stats.totalPasteles, icon: "🎂", iconClass: styles.statIconGreen },
    { label: "Recetas", value: stats.totalRecetas, icon: "📝", iconClass: styles.statIconAmber },
    { label: "Ingresos Totales", value: `$${stats.totalIngresos.toLocaleString()}`, icon: "💰", iconClass: styles.statIconBlue },
    { label: "Pedidos", value: stats.totalPedidos, icon: "📦", iconClass: styles.statIconPurple },
    { label: "Pendientes", value: stats.pedidosPendientes, icon: "⏳", iconClass: styles.statIconRose },
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Resumen general de la tienda</p>
      </div>

      <div className={styles.statsGrid}>
        {statsData.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${stat.iconClass}`}>{stat.icon}</div>
            <div>
              <span className={styles.statLabel}>{stat.label}</span>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panelsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            Pedidos Recientes
          </div>
          <div className={styles.panelBody}>
            {stats.recentPedidos.length === 0 ? (
              <div className={styles.emptyPanel}>No hay pedidos recientes</div>
            ) : (
              stats.recentPedidos.map((pedido: any, i: number) => (
                <div key={pedido._id || i} className={styles.recentRow}>
                  <div className={styles.recentLeft}>
                    <span className={styles.recentId}>
                      #{typeof pedido._id === 'string' ? pedido._id.slice(-6) : pedido._id}
                    </span>
                    <span className={styles.recentDate}>
                      {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : ''} · {pedido.items?.length || 0} item{(pedido.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      background: STATUS_MAP[pedido.estado] || '#f3f4f6',
                      color: '#374151',
                    }}>
                      {pedido.estado}
                    </span>
                    <span className={styles.recentTotal}>${pedido.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            Estado de Pedidos
          </div>
          <div className={styles.statusList}>
            {stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 ? (
              Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const maxCount = Math.max(...Object.values(stats.statusBreakdown), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={status} className={styles.statusRow}>
                    <span>
                      <span className={styles.statusDot} style={{ background: STATUS_DOT_MAP[status] || '#9ca3af' }} />
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <div className={styles.statusBar}>
                      <div className={styles.statusBarFill} style={{ width: `${pct}%`, background: STATUS_DOT_MAP[status] || '#9ca3af' }} />
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
