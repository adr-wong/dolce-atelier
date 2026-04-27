"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type Usuario = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  role: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminUsuarios() {
  const { getToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUsuarios() {
      const token = await getToken();
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Error cargando usuarios");
      return res.json();
    }

    getUsuarios()
      .then(setUsuarios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getToken]);

  const handleRoleChange = async (id: string, role: string) => {
    const token = await getToken();
    if (!token) return;
    
    await fetch(`${API_URL}/api/admin/usuarios/${id}/rol`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    
    setUsuarios(usuarios.map(u => u.id === id ? { ...u, role } : u));
  };

  const roleColors: Record<string, string> = {
    admin: "#8b5cf6",
    superadmin: "#ec4899",
    user: "#6b7280",
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: "2rem" }}>Gestión de Usuarios</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            <th style={{ padding: "1rem", textAlign: "left" }}>Email</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Nombre</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Fecha Registro</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Rol</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>{usuario.email}</td>
              <td style={{ padding: "1rem" }}>
                {usuario.firstName || ""} {usuario.lastName || ""}
              </td>
              <td style={{ padding: "1rem" }}>
                {new Date(usuario.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: "1rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    background: roleColors[usuario.role] || "#6b7280",
                    color: "#fff",
                  }}
                >
                  {usuario.role}
                </span>
              </td>
              <td style={{ padding: "1rem" }}>
                <select
                  value={usuario.role}
                  onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}