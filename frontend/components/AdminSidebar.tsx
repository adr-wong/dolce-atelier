"use client";

import Link from "next/link";

export default function AdminSidebar() {
  return (
    <div
      style={{
        width: 240,
        background: "#1f2937",
        color: "#fff",
        padding: "2rem 1rem",
      }}
    >
      <h2 style={{ marginBottom: "2rem", fontSize: "1.25rem" }}>Admin Panel</h2>
      <nav>
        <Link
          href="/admin"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 6,
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/admin/pasteles"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 6,
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Catálogo
        </Link>
        <Link
          href="/admin/pedidos"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 6,
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Pedidos
        </Link>
        <Link
          href="/admin/recetas"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 6,
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Recetas
        </Link>
      </nav>
    </div>
  );
}