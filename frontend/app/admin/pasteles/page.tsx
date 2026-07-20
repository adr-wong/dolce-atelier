"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { ClerkOfflineError } from "@clerk/react/errors";
import { toast } from "sonner";
import { getPasteles, createPastel, updatePastel, deletePastel } from "@/lib/adminApi";
import type { Pastel, PastelCreateInput } from "@/lib/adminApi";
import { getApiUrl } from "@/lib/get-api-url";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Pagination from "@/components/Pagination";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./pasteles.module.css";

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
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [pasteles, setPasteles] = useState<Pastel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPastel, setEditingPastel] = useState<Pastel | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Pastel | null>(null);
  const [formData, setFormData] = useState<PastelCreateInput>({
    nombre: "",
    descripcion: "",
    precio: 0,
    categoria: "general",
    imagen: "",
  });

  useEffect(() => {
    async function loadPasteles() {
      try {
        const token = await getToken();
        const result = await getPasteles(token!, { page: currentPage, limit });
        setPasteles(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (ClerkOfflineError.is(error)) {
          console.error("Offline:", error);
        } else {
          console.error("Error loading pasteles:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPasteles();
  }, [getToken, currentPage, limit]);

  const displayed = pasteles.filter((p) => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFiltro && p.categoria !== catFiltro) return false;
    return true;
  });

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
      }
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
      } else {
        console.error("Error uploading:", error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || formData.nombre.trim() === "") {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.precio || formData.precio <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    
    try {
      console.log("Creando pastel:", formData);
      const token = await getToken();
      const nuevo = await createPastel(token!, formData);
      console.log("Creado:", nuevo);
      setPasteles([...pasteles, nuevo]);
      setShowModal(false);
      setFormData({ nombre: "", descripcion: "", precio: 0, categoria: "general", imagen: "" });
      toast.success("Pastel creado exitosamente");
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error creating pastel:", error);
        toast.error("Error al crear pastel");
      }
    }
  };

  const handleEdit = (pastel: Pastel) => {
    setEditingPastel(pastel);
    setFormData({
      nombre: pastel.nombre,
      descripcion: pastel.descripcion || "",
      precio: pastel.precio,
      categoria: pastel.categoria || "general",
      imagen: pastel.imagen || "",
    });
    setShowModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || formData.nombre.trim() === "") {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.precio || formData.precio <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    if (!editingPastel?._id) return;
    
    try {
      const token = await getToken();
      const actualizado = await updatePastel(token!, editingPastel._id, formData);
      setPasteles(pasteles.map(p => p._id === editingPastel._id ? actualizado : p));
      closeModal();
      toast.success("Pastel actualizado exitosamente");
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error updating pastel:", error);
        toast.error("Error al actualizar pastel");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPastel(null);
    setFormData({ nombre: "", descripcion: "", precio: 0, categoria: "general", imagen: "" });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = await getToken();
      await deletePastel(token!, deleteConfirm._id);
      setPasteles(pasteles.filter(p => p._id !== deleteConfirm._id));
      toast.success("Pastel eliminado exitosamente");
    } catch (error) {
      if (ClerkOfflineError.is(error)) {
        console.error("Offline:", error);
        toast.error("Sin conexión a internet");
      } else {
        console.error("Error deleting pastel:", error);
        toast.error("Error al eliminar pastel");
      }
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={styles.pageHeader}>
          <h1>Gestión de Pasteles</h1>
        </div>
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.header}>
        <h1>Gestión de Pasteles</h1>
        <button
          onClick={() => setShowModal(true)}
          className={styles.addBtn}
        >
          + Nuevo Pastel
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre..."
          />
        </div>
        <select
          value={catFiltro}
          onChange={(e) => setCatFiltro(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todas las categorías</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <form onSubmit={editingPastel ? handleUpdate : handleSubmit} className={styles.form}>
            <h2 className={styles.formTitle}>{editingPastel ? "Editar Pastel" : "Nuevo Pastel"}</h2>
            
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className={styles.input}
              />
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Precio</label>
              <input
                type="number"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className={styles.input}
              >
                <option value="general">General</option>
                <option value="chocolate">Chocolate</option>
                <option value="vainilla">Vainilla</option>
                <option value="fruta">Fruta</option>
                <option value="especial">Especial</option>
              </select>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className={styles.fileInput}
              />
              {uploading && <p>Subiendo...</p>}
              {formData.imagen && (
                <div className={styles.previewContainer}>
                  <img src={formData.imagen} alt="Preview" className={styles.previewImg} />
                  <p className={styles.uploadedText}>✓ Imagen cargada</p>
                </div>
              )}
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                {editingPastel ? "Actualizar" : "Crear"}
              </button>
              <button type="button" onClick={() => closeModal()} className={styles.cancelBtn}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          icon="🍰"
          title="No se encontraron pasteles"
          description={search || catFiltro ? "Prueba con otros términos o categoría" : "No hay pasteles registrados"}
        />
      ) : isMobile ? (
        <div className={styles.mobileCards}>
          {displayed.map((pastel) => (
            <div key={pastel._id} className={styles.card}>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Nombre</span>
                <span className={styles.cardValue}>{pastel.nombre}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Categoría</span>
                <span className={styles.cardValue} style={{ textTransform: "capitalize" }}>{pastel.categoria}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Precio</span>
                <span className={styles.cardValue}>${pastel.precio}</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>Estado</span>
                <span className={styles.cardValue}>
                  <span className={`${styles.statusBadge} ${pastel.disponible ? styles.statusActive : styles.statusInactive}`}>
                    {pastel.disponible ? "Activo" : "Agotado"}
                  </span>
                </span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleEdit(pastel)}
                >
                  ✏️ Editar
                </button>
                <button
                  className={styles.actionBtnDanger}
                  onClick={() => setDeleteConfirm(pastel)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadTr}>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Categoría</th>
                <th className={styles.th}>Precio</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((pastel) => (
                <tr key={pastel._id} className={styles.tr}>
                  <td className={styles.td}>{pastel.nombre}</td>
                  <td className={`${styles.td} ${styles.capitalize}`}>{pastel.categoria}</td>
                  <td className={styles.td}>${pastel.precio}</td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${pastel.disponible ? styles.statusActive : styles.statusInactive}`}>
                      {pastel.disponible ? "Activo" : "Agotado"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => handleEdit(pastel)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionBtnDanger}
                      onClick={() => setDeleteConfirm(pastel)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Eliminar pastel"
        message={deleteConfirm ? `¿Estás seguro de eliminar "${deleteConfirm.nombre}"?` : ""}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
