import axios from "axios";
import { useMemo, useState } from "react";
import { CategoriaSelect } from "./CategoriaSelect";
import { IngredientesMultiSelect } from "./IngredientesMultiSelect";
import { createProducto } from "../services/menuService";
import type { ApiErrorBody, CreateProductoData, CategoriaProducto } from "../types";
import { formatCurrency } from "../utils/format";

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

  const [precioInput, setPrecioInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const precioParsed = useMemo(() => {
    const normalized = precioInput.replace(",", ".").trim();
    if (!normalized) return 0;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return 0;
    return parsed;
  }, [precioInput]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    const categoriasValidas: CategoriaProducto[] = [
      "ENTRADA",
      "PLATO_FUERTE",
      "BEBIDA",
      "POSTRE",
    ];
    if (!formData.categoria) {
      newErrors.categoria = "La categoría es obligatoria";
    } else if (!categoriasValidas.includes(formData.categoria)) {
      newErrors.categoria = "La categoría es inválida";
    }
    const decMatch = precioInput.replace(",", ".").match(/^\d+(?:\.(\d{1,2}))?$/);
    if (!precioInput.trim()) {
      newErrors.precio = "El precio es obligatorio";
    } else if (!decMatch) {
      newErrors.precio = "El precio debe tener maximo 2 decimales";
    } else if (precioParsed <= 0) {
      newErrors.precio = "El precio debe ser mayor a 0";
    }
    if (formData.tiempo_preparacion <= 0) newErrors.tiempo_preparacion = "El tiempo debe ser mayor a 0";
     if (formData.ingredientes.length === 0) {
      newErrors.ingredientes = "Agrega al menos un ingrediente";
    } else if (formData.ingredientes.some((item) => !item.ingrediente_id || item.cantidad <= 0)) {
      newErrors.ingredientes = "Cada ingrediente debe tener una cantidad mayor a 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setFormData({ ...formData, imagen: null });
      setImagePreview(null);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.imagen;
        return next;
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, imagen: "Selecciona un archivo de imagen valido" }));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imagen: "La imagen no puede superar 3 MB" }));
      return;
    }

    setFormData({ ...formData, imagen: file });
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.imagen;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const precioFinal = Number(precioParsed.toFixed(2));
      await createProducto({ ...formData, precio: precioFinal });
      onToast("Producto creado exitosamente");
      onSuccess();
    } catch (error: any) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const status = error.response?.status;
        const data = error.response?.data as ApiErrorBody & { code?: string };
        const code = data?.error ?? data?.code;
        const message = data?.message;

        if (code === "PRODUCTO_DUPLICADO") {
          onToast("Ya existe un producto con ese nombre");
          return;
        }

        if (status === 422 && code === "PRECIO_INVALIDO") {
          setErrors((prev) => ({ ...prev, precio: "El precio debe ser mayor a 0" }));
          return;
        }

        if (status === 422 && code === "INGREDIENTES_INVALIDOS") {
          setErrors((prev) => ({ ...prev, ingredientes: "Selecciona al menos un ingrediente valido" }));
          onToast("Debes agregar al menos un ingrediente valido");
          return;
        }

        if (status === 400) {
          if (Array.isArray(message) && message.some((m) => String(m).toLowerCase().includes("categoria"))) {
            setErrors((prev) => ({ ...prev, categoria: "La categoría es inválida" }));
            return;
          }
          onToast("Error en los datos del formulario");
          return;
        }
      }

      onToast("Error al crear el producto");
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
          <label htmlFor="precio">Precio de Venta (COP)</label>
          <div style={{ position: "relative" }}>
            <input
              id="precio"
              type="number"
              step="0.01"
              value={precioInput}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".");
                if (raw === "" || /^\d*(?:\.\d{0,2})?$/.test(raw)) setPrecioInput(e.target.value);
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
          {precioParsed > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#007a2f" }}>
              Valor: {formatCurrency(precioParsed)}
            </p>
          )}
          {errors.precio && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.precio}</span>}
        </div>

      <IngredientesMultiSelect
        selectedIngredientes={formData.ingredientes}
        onChange={(ingredientes) => setFormData({ ...formData, ingredientes })}
        error={errors.ingredientes}
      />

      <div className="form-field">
        <label htmlFor="producto-imagen">Foto del producto</label>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <label
            htmlFor="producto-imagen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "12px",
              border: errors.imagen ? "1px dashed #d1141f" : "1px dashed #d1d5db",
              color: "#0f172a",
              cursor: "pointer",
              background: "#fafafa",
              fontWeight: 700,
            }}
          >
            Seleccionar foto
          </label>
          <input id="producto-imagen" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: "none" }} />
          {imagePreview ? (
            <img src={imagePreview} alt="Vista previa" style={{ width: "96px", height: "96px", objectFit: "cover", borderRadius: "14px", border: "1px solid #e5e7eb" }} />
          ) : (
            <span style={{ color: "#667085", fontSize: "0.9rem" }}>Sin foto seleccionada</span>
          )}
        </div>
        {errors.imagen && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.imagen}</span>}
      </div>

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
