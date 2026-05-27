import { useState } from "react";
import { CategoriaSelect } from "./CategoriaSelect";
import { IngredientesMultiSelect } from "./IngredientesMultiSelect";
import { updateProducto } from "../services/menuService";
import type { Producto, CreateProductoData } from "../types";
import { formatCurrency } from "../utils/format";

type Props = {
  producto: Producto;
  onSuccess: (productoActualizado: Producto) => void;
  onCancel: () => void;
  onToast: (message: string) => void;
  onPermissionError: (mensaje: string) => void;
};

export function FormularioEditarProducto({ 
  producto, 
  onSuccess, 
  onCancel, 
  onToast,
  onPermissionError 
}: Props) {
  const [formData, setFormData] = useState<Partial<CreateProductoData>>({
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: typeof producto.precio === 'string' ? parseFloat(producto.precio) : producto.precio,
    tiempo_preparacion: producto.tiempo_preparacion || producto.tiempoPreparacion || 0,
    ingredientes: producto.ingredientes?.map(ing => ing.id) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre?.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.categoria) newErrors.categoria = "La categoría es obligatoria";
    if (formData.precio && formData.precio <= 0) newErrors.precio = "El precio debe ser mayor a 0";
    if (formData.tiempo_preparacion && formData.tiempo_preparacion <= 0) newErrors.tiempo_preparacion = "El tiempo debe ser mayor a 0";
    if (formData.ingredientes && formData.ingredientes.length === 0) newErrors.ingredientes = "Selecciona al menos un ingrediente";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const productoActualizado = await updateProducto(producto.id, formData);
      onToast("Producto actualizado exitosamente");
      onSuccess(productoActualizado);
    } catch (error: any) {
      if (error.response?.status === 403) {
        onPermissionError("Sin permisos para esta accion");
      } else {
        const data = error.response?.data;
        if (data?.statusCode === 400 && Array.isArray(data.message)) {
          onToast("Error en los datos del formulario");
        } else {
          onToast("Error al actualizar el producto");
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
          value={formData.categoria || ""}
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
        <label htmlFor="precio">Precio de Venta (COP)</label>
        <div style={{ position: "relative" }}>
          <input
            id="precio"
            type="number"
            step="1"
            value={formData.precio || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                setFormData({ ...formData, precio: Number(val) });
              }
            }}
            placeholder="12000"
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
        {formData.precio && formData.precio > 0 && (
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#007a2f" }}>
            Valor: {formatCurrency(formData.precio)}
          </p>
        )}
        {errors.precio && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.precio}</span>}
      </div>

      <IngredientesMultiSelect
        selectedIds={formData.ingredientes || []}
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
