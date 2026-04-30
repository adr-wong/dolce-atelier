"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getDashboardStats } from "@/lib/adminApi";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function AdminDashboard() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { getToken } = useAuth();
  const [stats, setStats] = useState({
    totalPedidos: 0,
    totalRecetas: 0,
    totalPasteles: 0,
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
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [getToken]);

  if (loading) return <div>Cargando...</div>;

  const statsData = [
    { label: "Pedidos Hoy", value: stats.totalPedidos, color: "#3b82f6" },
    { label: "Recetas Pendientes", value: stats.totalRecetas, color: "#f59e0b" },
    { label: "Productos", value: stats.totalPasteles, color: "#10b981" },
    { label: "Pedidos Recientes", value: stats.recentPedidos.length, color: "#8b5cf6" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: isMobile ? '1rem' : '2rem', fontSize: isMobile ? '1.5rem' : '2rem' }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: isMobile ? "0.75rem" : "1.5rem" }}>
        {statsData.map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: isMobile ? "1rem" : "1.5rem",
              borderRadius: "12px",
              border: "1px solid #eee",
            }}
          >
            <p style={{ color: "#666", marginBottom: "0.5rem", fontSize: isMobile ? "0.8rem" : "0.9rem" }}>{stat.label}</p>
            <p style={{ fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: "bold", color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}