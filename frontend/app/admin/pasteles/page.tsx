"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { toast } from "sonner";
import { getPasteles, createPastel, updatePastel, deletePastel } from "@/lib/adminApi";
import type { Pastel, PastelCreateInput } from "@/lib/adminApi";
import { getApiUrl } from "@/lib/get-api-url";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import SearchInput from "@/components/SearchInput";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "@/styles/admin/shared.module.css";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "chocolate", label: "Chocolate" },
  { value: "vainilla", label: "Vainilla" },
  { value: "fruta", label: "Fruta" },
  { value: "especial", label: "Especial" },
];

export default function AdminPasteles() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [pasteles, setPasteles] = useState<Pastel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPastel, setEditingPastel] = useState<Pastel | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Pastel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PastelCreateInput>({
    nombre: "",
    descripcion: "",
    precio: 0,
    categoria: "general",
    imagen: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadPasteles = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await getPasteles(token, { search: search || undefined, page: currentPage, limit });
      setPasteles(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error loading pasteles:", error);
        toast.error("Error al cargar pasteles");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, search, currentPage, limit]);

  useEffect(() => { loadPasteles(); }, [loadPasteles]);

  const filtered = catFiltro
    ? pasteles.filter((p) => p.categoria === catFiltro)
    : pasteles;

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "", precio: 0, categoria: "general", imagen: "" });
    setFormErrors({});
    setEditingPastel(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (pastel: Pastel) => {
    setEditingPastel(pastel);
    setFormData({
      nombre: pastel.nombre,
      descripcion: pastel.descripcion || "",
      precio: pastel.precio,
      categoria: pastel.categoria || "general",
      imagen: pastel.imagen || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!formData.precio || formData.precio <= 0) errors.precio = "El precio debe ser mayor a 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiUrl()}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.url) {
        setFormData({ ...formData, imagen: data.url });
        toast.success("Imagen cargada");
      }
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const token = await getToken();
      if (!token) return;
      if (editingPastel?._id) {
        await updatePastel(token, editingPastel._id, formData);
        toast.success("Pastel actualizado");
      } else {
        const nuevo = await createPastel(token, formData);
        setPasteles([nuevo, ...pasteles]);
        toast.success("Pastel creado");
      }
      closeModal();
      loadPasteles();
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        toast.error("Sin conexión a internet");
      } else {
        toast.error("Error al guardar");
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deletePastel(token, deleteConfirm._id);
      setPasteles(pasteles.filter((p) => p._id !== deleteConfirm._id));
      toast.success("Pastel eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleDisponible = async (pastel: Pastel) => {
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await updatePastel(token, pastel._id, { disponible: !pastel.disponible });
      setPasteles(pasteles.map((p) => (p._id === pastel._id ? updated : p)));
    } catch {
      toast.error("Error al actualizar");
    }
  };

  if (loading) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Gestión de Pasteles</h1>
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  const btnStyle = (disabled: boolean) => ({
    padding: "0.35rem 0.65rem",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: disabled ? "default" : "pointer",
    fontSize: "0.8rem",
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Pasteles</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>
          + Nuevo Pastel
        </button>
      </div>

      <div className={styles.toolbar}>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Buscar pastel..." />
        <select className={styles.filterSelect} value={catFiltro} onChange={(e) => { setCatFiltro(e.target.value); setCurrentPage(1); }}>
          <option value="">Todas las categorías</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginLeft: "auto" }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎂"
          title="No hay pasteles"
          description={search || catFiltro ? "Prueba con otros filtros" : "Crea tu primer pastel"}
          action={!search && !catFiltro ? { label: "Nuevo Pastel", onClick: openCreate } : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrapper} style={{ flex: 1, overflow: 'hidden' }}>
            <table className={styles.desktopTable}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {filtered.map((pastel) => (
                  <tr key={pastel._id} className={styles.tableRow}>
                    <td style={{ fontWeight: 500 }}>{pastel.nombre}</td>
                    <td style={{ textTransform: "capitalize" }}>{pastel.categoria}</td>
                    <td>${pastel.precio.toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => handleToggleDisponible(pastel)}
                        style={{
                          padding: "0.2rem 0.65rem",
                          borderRadius: 8,
                          fontSize: "0.78rem",
                          border: "none",
                          cursor: "pointer",
                          background: pastel.disponible ? "#dcfce7" : "#fee2e2",
                          color: pastel.disponible ? "#166534" : "#991b1b",
                        }}
                        title="Click para cambiar estado"
                      >
                        {pastel.disponible ? "Activo" : "Agotado"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button style={btnStyle(false)} onClick={() => openEdit(pastel)} title="Editar">✏️</button>
                        <button style={btnStyle(false)} onClick={() => setDeleteConfirm(pastel)} title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.mobileCards}>
            {filtered.map((pastel) => (
              <div key={pastel._id} className={styles.card}>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Nombre</span>
                  <span className={styles.cardValue} style={{ fontWeight: 500 }}>{pastel.nombre}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Categoría</span>
                  <span className={styles.cardValue} style={{ textTransform: "capitalize" }}>{pastel.categoria}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Precio</span>
                  <span className={styles.cardValue} style={{ fontWeight: 600 }}>${pastel.precio.toFixed(2)}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Estado</span>
                  <button
                    onClick={() => handleToggleDisponible(pastel)}
                    style={{
                      padding: "0.2rem 0.65rem",
                      borderRadius: 8,
                      fontSize: "0.78rem",
                      border: "none",
                      cursor: "pointer",
                      background: pastel.disponible ? "#dcfce7" : "#fee2e2",
                      color: pastel.disponible ? "#166534" : "#991b1b",
                    }}
                  >
                    {pastel.disponible ? "Activo" : "Agotado"}
                  </button>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => openEdit(pastel)}>✏️ Editar</button>
                  <button onClick={() => setDeleteConfirm(pastel)} style={{ color: "#ef4444", borderColor: "#fee2e2" }}>🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <form className={styles.modal} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editingPastel ? "Editar Pastel" : "Nuevo Pastel"}</h2>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre *</label>
              <input className={styles.formInput} value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
              {formErrors.nombre && <p className={styles.formError}>{formErrors.nombre}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descripción</label>
              <textarea className={styles.formInput} rows={3} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio *</label>
                <input className={styles.formInput} type="number" min="0" step="0.01" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })} />
                {formErrors.precio && <p className={styles.formError}>{formErrors.precio}</p>}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                <select className={styles.formInput} value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}>
                  {CATEGORY_OPTIONS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Imagen</label>
              <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "⏳ Subiendo..." : "📷 Click para subir imagen"}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
              {formData.imagen && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={formData.imagen} alt="Preview" className={styles.imgPreview} />
                  <span style={{ fontSize: "0.8rem", color: "#10b981" }}>✓ Imagen cargada</span>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={closeModal}>Cancelar</button>
              <button type="submit" className={styles.btnPrimary}>{editingPastel ? "Guardar cambios" : "Crear"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Eliminar pastel"
        message={`¿Estás seguro de eliminar "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
