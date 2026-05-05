"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPasteles, createPastel, updatePastel, deletePastel } from "@/lib/adminApi";
import type { Pastel, PastelCreateInput } from "@/lib/adminApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminPasteles() {
  const { getToken } = useAuth();
  const [pasteles, setPasteles] = useState<Pastel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPastel, setEditingPastel] = useState<Pastel | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        const data = await getPasteles(token);
        setPasteles(data);
      } catch (error) {
        console.error("Error loading pasteles:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPasteles();
  }, [getToken]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    
    try {
      const token = await getToken();
      
      const res = await fetch(`${API_URL}/api/upload`, {
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
      alert("El nombre es requerido");
      return;
    }
    if (!formData.precio || formData.precio <= 0) {
      alert("El precio debe ser mayor a 0");
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
    } catch (error) {
      console.error("Error creating pastel:", error);
      alert("Error al crear pastel: " + error);
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
      alert("El nombre es requerido");
      return;
    }
    if (!formData.precio || formData.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }
    if (!editingPastel?._id) return;
    
    try {
      const token = await getToken();
      if (!token) return;
      const actualizado = await updatePastel(token, editingPastel._id, formData);
      setPasteles(pasteles.map(p => p._id === editingPastel._id ? actualizado : p));
      closeModal();
    } catch (error) {
      console.error("Error updating pastel:", error);
      alert("Error al actualizar pastel: " + error);
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
    } catch (error) {
      console.error("Error deleting pastel:", error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Gestión de Pasteles</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#e11d48",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          + Nuevo Pastel
        </button>
      </div>

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <form onSubmit={editingPastel ? handleUpdate : handleSubmit} style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            width: "400px",
          }}>
            <h2 style={{ marginBottom: "1.5rem" }}>{editingPastel ? "Editar Pastel" : "Nuevo Pastel"}</h2>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Nombre</label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Precio</label>
              <input
                type="number"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                required
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                style={{ width: "100%", padding: "0.5rem" }}
              >
                <option value="general">General</option>
                <option value="chocolate">Chocolate</option>
                <option value="vainilla">Vainilla</option>
                <option value="fruta">Fruta</option>
                <option value="especial">Especial</option>
              </select>
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                ref={fileInputRef}
                style={{ width: "100%" }}
              />
              {uploading && <p>Subiendo...</p>}
              {formData.imagen && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={formData.imagen} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                  <p style={{ fontSize: "0.8rem", color: "green" }}>✓ Imagen cargada</p>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#e11d48",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => closeModal()}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#6b7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              {editingPastel && (
                <button
                  type="button"
                  onClick={() => closeModal()}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#f9fafb" }}>
            <th style={{ padding: "1rem", textAlign: "left" }}>Nombre</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Categoría</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Precio</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Estado</th>
            <th style={{ padding: "1rem", textAlign: "left" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pasteles.map((pastel) => (
            <tr key={pastel._id} style={{ borderTop: "1px solid #eee" }}>
              <td style={{ padding: "1rem" }}>{pastel.nombre}</td>
              <td style={{ padding: "1rem", textTransform: "capitalize" }}>{pastel.categoria}</td>
              <td style={{ padding: "1rem" }}>${pastel.precio}</td>
              <td style={{ padding: "1rem" }}>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    background: pastel.disponible ? "#dcfce7" : "#fee2e2",
                    color: pastel.disponible ? "#166534" : "#991b1b",
                  }}
                >
                  {pastel.disponible ? "Activo" : "Agotado"}
                </span>
              </td>
              <td style={{ padding: "1rem" }}>
                <button 
                  style={{ marginRight: "0.5rem", padding: "0.5rem", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => handleEdit(pastel)}
                >
                  ✏️
                </button>
                <button
                  style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer" }}
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
  );
}