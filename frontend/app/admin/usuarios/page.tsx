"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getApiUrl } from "@/lib/get-api-url";
import styles from "./usuarios.module.css";

type Usuario = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  role: string;
};

export default function AdminUsuarios() {
  const { getToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUsuarios() {
      const token = await getToken();
      
      const res = await fetch(`${getApiUrl()}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Error cargando usuarios");
      return res.json();
    }

    getUsuarios()
      .then(setUsuarios)
      .catch((error) => {
        if (ClerkOfflineError.is(error)) {
          console.error('Offline:', error);
        } else {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));
  }, [getToken]);

  const handleRoleChange = async (id: string, role: string) => {
    const token = await getToken();
    
    await fetch(`${getApiUrl()}/api/admin/usuarios/${id}/rol`, {
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
      <h1 className={styles.title}>Gestión de Usuarios</h1>

      <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.theadTr}>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Nombre</th>
            <th className={styles.th}>Fecha Registro</th>
            <th className={styles.th}>Rol</th>
            <th className={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className={styles.tr}>
              <td className={styles.td}>{usuario.email}</td>
              <td className={styles.td}>
                {usuario.firstName || ""} {usuario.lastName || ""}
              </td>
              <td className={styles.td}>
                {new Date(usuario.createdAt).toLocaleDateString()}
              </td>
              <td className={styles.td}>
                <span
                  className={styles.roleBadge}
                  style={{
                    background: roleColors[usuario.role] || "#6b7280",
                  }}
                >
                  {usuario.role}
                </span>
              </td>
              <td className={styles.td}>
                <select
                  value={usuario.role}
                  onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                  className={styles.roleSelect}
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
    </div>
  );
}
