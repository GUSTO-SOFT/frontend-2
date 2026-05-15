import { useState } from "react";
import { CategoriaSelect } from "./CategoriaSelect";
import { IngredientesMultiSelect } from "./IngredientesMultiSelect";
import { createProducto } from "../services/menuService";
import type { CreateProductoData, CategoriaProducto } from "../types";
import axios from "axios";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  onToast: (message: string) => void;
};

export function ProductoForm({ onSuccess, onCancel, onToast }: Props) {
  const [formData, setFormData] = useState<CreateProductoData>({
    nombre: "",
    categoria: "" as CategoriaProducto,
    precio: 0,
    tiempo_preparacion: 0,
    ingredientes: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.categoria) newErrors.categoria = "La categoría es obligatoria";
    if (formData.precio <= 0) newErrors.precio = "El precio debe ser mayor a 0";
    if (formData.tiempo_preparacion <= 0) newErrors.tiempo_preparacion = "El tiempo debe ser mayor a 0";
    if (formData.ingredientes.length === 0) newErrors.ingredientes = "Selecciona al menos un ingrediente";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createProducto(formData);
      onToast("Producto creado exitosamente");
      onSuccess();
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data?.error === "PRODUCTO_DUPLICADO") {
          onToast("Ya existe un producto con ese nombre");
        } else if (data?.statusCode === 400 && Array.isArray(data.message)) {
          // Manejar errores de validación de class-validator
          onToast("Error en los datos del formulario");
        } else {
          onToast("Error al crear el producto");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form" style={{ display: "grid", gap: "24px" }}>
      <div className="form-field">
        <label htmlFor="nombre">Nombre del Platillo</label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Ensalada Gourmet California"
          style={{
            width: "100%",
            minHeight: "48px",
            border: errors.nombre ? "1px solid #d1141f" : "1px solid #d8deea",
            borderRadius: "14px",
            padding: "0 16px"
          }}
        />
        {errors.nombre && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.nombre}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <CategoriaSelect
          value={formData.categoria}
          onChange={(val) => setFormData({ ...formData, categoria: val })}
          error={errors.categoria}
        />
        <div className="form-field">
          <label htmlFor="tiempo">Tiempo de Preparación (Minutos)</label>
          <div style={{ position: "relative" }}>
            <input
              id="tiempo"
              type="number"
              value={formData.tiempo_preparacion || ""}
              onChange={(e) => setFormData({ ...formData, tiempo_preparacion: Number(e.target.value) })}
              placeholder="15"
              style={{
                width: "100%",
                minHeight: "48px",
                border: errors.tiempo_preparacion ? "1px solid #d1141f" : "1px solid #d8deea",
                borderRadius: "14px",
                padding: "0 16px 0 40px"
              }}
            />
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#667085" }}>🕒</span>
          </div>
          {errors.tiempo_preparacion && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.tiempo_preparacion}</span>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="precio">Precio de Venta ($)</label>
        <div style={{ position: "relative" }}>
          <input
            id="precio"
            type="number"
            step="0.01"
            value={formData.precio || ""}
            onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
            placeholder="12.50"
            style={{
              width: "100%",
              minHeight: "48px",
              border: errors.precio ? "1px solid #d1141f" : "1px solid #d8deea",
              borderRadius: "14px",
              padding: "0 16px 0 30px"
            }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#667085" }}>$</span>
        </div>
        {errors.precio && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.precio}</span>}
      </div>

      <IngredientesMultiSelect
        selectedIds={formData.ingredientes}
        onChange={(ids) => setFormData({ ...formData, ingredientes: ids })}
        error={errors.ingredientes}
      />

      <div className="modal-actions" style={{ marginTop: "12px" }}>
        <button 
          type="button" 
          className="secondary-button" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="primary-button" 
          disabled={isSubmitting}
          style={{ background: "#d1141f" }}
        >
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
