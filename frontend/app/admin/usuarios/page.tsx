"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { getApiUrl } from "@/lib/get-api-url";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Pagination from "@/components/Pagination";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./usuarios.module.css";

type Usuario = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
  role: string;
};

type UsuariosResponse = {
  usuarios: Usuario[];
  total: number;
  page: number;
  totalPages: number;
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#8b5cf6",
  superadmin: "#ec4899",
  user: "#6b7280",
};

export default function AdminUsuarios() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleChange, setRoleChange] = useState<{ id: string; newRole: string } | null>(null);

  useEffect(() => {
    async function getUsuarios() {
      try {
        const token = await getToken();
        const res = await fetch(
          `${getApiUrl()}/api/admin/usuarios?page=${currentPage}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Error cargando usuarios");
        const data: UsuariosResponse = await res.json();
        setUsuarios(data.usuarios);
        setTotalPages(data.totalPages);
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          console.error('Offline:', error);
        } else {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }

    getUsuarios();
  }, [getToken, currentPage, limit]);

  const displayed = usuarios.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.firstName || "").toLowerCase().includes(term) ||
      (u.lastName || "").toLowerCase().includes(term)
    );
  });

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

  const confirmRoleChange = async () => {
    if (!roleChange) return;
    const { id, newRole } = roleChange;
    setRoleChange(null);
    await handleRoleChange(id, newRole);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={styles.pageHeader}>
          <h1>Gestión de Usuarios</h1>
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por email o nombre..."
          />
        </div>
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No se encontraron usuarios"
          description={search ? "Prueba con otros términos de búsqueda" : "No hay usuarios registrados"}
        />
      ) : isMobile ? (
        <div className={styles.mobileCards}>
          {displayed.map((usuario) => (
            <div key={usuario.id} className={styles.card}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Email</span>
                <span className={styles.cardValue} style={{ fontWeight: 500, fontSize: "0.8rem" }}>{usuario.email}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Nombre</span>
                <span className={styles.cardValue}>{(usuario.firstName || "")} {(usuario.lastName || "")}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Registro</span>
                <span className={styles.cardValue}>{new Date(usuario.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Rol</span>
                <span className={styles.cardValue}>
                  <span
                    className={styles.roleBadge}
                    style={{ background: ROLE_COLORS[usuario.role] || "#6b7280" }}
                  >
                    {usuario.role}
                  </span>
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Acciones</span>
                <span className={styles.cardValue}>
                  <select
                    value={usuario.role}
                    onChange={(e) => setRoleChange({ id: usuario.id, newRole: e.target.value })}
                    className={styles.roleSelect}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
              {displayed.map((usuario) => (
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
                        background: ROLE_COLORS[usuario.role] || "#6b7280",
                      }}
                    >
                      {usuario.role}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <select
                      value={usuario.role}
                      onChange={(e) => setRoleChange({ id: usuario.id, newRole: e.target.value })}
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
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ConfirmDialog
        open={!!roleChange}
        title="Cambiar rol"
        message={roleChange ? "¿Estás seguro de cambiar el rol de este usuario?" : ""}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleChange(null)}
      />
    </div>
  );
}
