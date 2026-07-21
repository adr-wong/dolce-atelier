"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/get-api-url";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import Pagination from "@/components/Pagination";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "@/styles/admin/shared.module.css";

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

const ROLE_LABELS: Record<string, string> = {
  user: "Usuario",
  admin: "Admin",
  superadmin: "Super Admin",
};

export default function AdminUsuarios() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleChange, setRoleChange] = useState<{ id: string; newRole: string } | null>(null);

  useEffect(() => {
    async function getUsuarios() {
      try {
        const token = await getToken();
        if (!token) return;
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
          console.error("Offline:", error);
          toast.error("Sin conexión a internet");
        } else {
          console.error(error);
          toast.error("Error al cargar usuarios");
        }
      } finally {
        setLoading(false);
      }
    }

    getUsuarios();
  }, [getToken, currentPage, limit]);

  const filtered = usuarios.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.firstName || "").toLowerCase().includes(term) ||
      (u.lastName || "").toLowerCase().includes(term)
    );
  });

  const handleRoleChangeRequest = (id: string, newRole: string) => {
    setRoleChange({ id, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChange) return;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${getApiUrl()}/api/admin/usuarios/${roleChange.id}/rol`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: roleChange.newRole }),
      });
      if (!res.ok) throw new Error("Error");
      setUsuarios(usuarios.map((u) => (u.id === roleChange.id ? { ...u, role: roleChange.newRole } : u)));
      toast.success("Rol actualizado");
    } catch {
      toast.error("Error al cambiar rol");
    } finally {
      setRoleChange(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  const roleBadgeStyle = (role: string) => ({
    padding: "0.2rem 0.65rem",
    borderRadius: 8,
    fontSize: "0.78rem",
    fontWeight: 500,
    background: ROLE_COLORS[role] || "#6b7280",
    color: "#fff",
  });

  const selectStyle: React.CSSProperties = {
    padding: "0.4rem 0.5rem",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    fontSize: "0.8rem",
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
      </div>

      <div className={styles.toolbar}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Buscar por email o nombre..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No se encontraron usuarios"
          description={search ? "Prueba con otros términos de búsqueda" : "No hay usuarios registrados"}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrapper} style={{ flex: 1, overflow: 'hidden' }}>
            <table className={styles.desktopTable}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Registro</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filtered.map((usuario) => (
                  <tr key={usuario.id} className={styles.tableRow}>
                    <td style={{ fontWeight: 500 }}>{usuario.email}</td>
                    <td>{(usuario.firstName || "")} {(usuario.lastName || "")}</td>
                    <td>{new Date(usuario.createdAt).toLocaleDateString()}</td>
                    <td><span style={roleBadgeStyle(usuario.role)}>{ROLE_LABELS[usuario.role] || usuario.role}</span></td>
                    <td>
                      <select
                        style={selectStyle}
                        value={usuario.role}
                        onChange={(e) => handleRoleChangeRequest(usuario.id, e.target.value)}
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

          {/* Mobile cards */}
          <div className={styles.mobileCards}>
            {filtered.map((usuario) => (
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
                  <span style={roleBadgeStyle(usuario.role)}>{ROLE_LABELS[usuario.role] || usuario.role}</span>
                </div>
                <div className={styles.cardActions}>
                  <select
                    style={{ ...selectStyle, flex: 1 }}
                    value={usuario.role}
                    onChange={(e) => handleRoleChangeRequest(usuario.id, e.target.value)}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Role change confirmation */}
      <ConfirmDialog
        open={!!roleChange}
        title="Cambiar rol"
        message={`¿Confirmas cambiar el rol a ${ROLE_LABELS[roleChange?.newRole || ""] || roleChange?.newRole}?`}
        confirmLabel="Confirmar"
        variant="warning"
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleChange(null)}
      />
    </div>
  );
}
