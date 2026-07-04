"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { getPasteles, createPastel, updatePastel, deletePastel } from "@/lib/adminApi";
import type { Pastel, PastelCreateInput } from "@/lib/adminApi";
import { getApiUrl } from "@/lib/get-api-url";
import { useAdaptiveRows } from "@/hooks/useAdaptiveRows";
import Pagination from "@/components/Pagination";
import styles from "./pasteles.module.css";

export default function AdminPasteles() {
  const { getToken } = useAuth();
  const limit = useAdaptiveRows();
  const [pasteles, setPasteles] = useState<Pastel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPastel, setEditingPastel] = useState<Pastel | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        if (!token) return;
        const result = await getPasteles(token, { page: currentPage, limit });
        setPasteles(result.data);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Error loading pasteles:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPasteles();
  }, [getToken, currentPage, limit]);

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
      console.error("Error uploading:", error);
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
      if (!token) return;
      const nuevo = await createPastel(token, formData);
      console.log("Creado:", nuevo);
      setPasteles([...pasteles, nuevo]);
      setShowModal(false);
      setFormData({ nombre: "", descripcion: "", precio: 0, categoria: "general", imagen: "" });
      toast.success("Pastel creado exitosamente");
    } catch (error) {
      console.error("Error creating pastel:", error);
      toast.error("Error al crear pastel");
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
      if (!token) return;
      const actualizado = await updatePastel(token, editingPastel._id, formData);
      setPasteles(pasteles.map(p => p._id === editingPastel._id ? actualizado : p));
      closeModal();
      toast.success("Pastel actualizado exitosamente");
    } catch (error) {
      console.error("Error updating pastel:", error);
      toast.error("Error al actualizar pastel");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPastel(null);
    setFormData({ nombre: "", descripcion: "", precio: 0, categoria: "general", imagen: "" });
  };

  const handleDelete = async (id: string, imagenUrl?: string) => {
    if (!confirm("¿Estás seguro de eliminar este pastel?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deletePastel(token, id);
      setPasteles(pasteles.filter(p => p._id !== id));
      toast.success("Pastel eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting pastel:", error);
      toast.error("Error al eliminar pastel");
    }
  };

  if (loading) return <div>Cargando...</div>;

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
            {pasteles.map((pastel) => (
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
                    onClick={() => handleDelete(pastel._id, pastel.imagen)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
