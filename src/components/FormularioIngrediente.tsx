import axios from "axios";
import { useMemo, useState } from "react";
import type { ApiErrorBody, CreateIngredienteData, Ingrediente } from "../types";
import { createIngrediente } from "../services/inventarioService";

type Props = {
  onSuccess: (ingrediente: Ingrediente, imagePreview?: string) => void;
  onToast: (message: string, type?: "success" | "error") => void;
};

const UNIDADES = ["KG", "G", "L", "ML", "UNIDAD"] as const;

type UnidadMedida = (typeof UNIDADES)[number];

export function FormularioIngrediente({ onSuccess, onToast }: Props) {
  const [formData, setFormData] = useState<CreateIngredienteData>({
    nombre: "",
    unidad_medida: "KG",
    stock_actual: 0,
    stock_minimo: 0,
  });
  const [stockActualInput, setStockActualInput] = useState("0");
  const [stockMinimoInput, setStockMinimoInput] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const stockActual = useMemo(() => {
    const normalized = stockActualInput.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [stockActualInput]);

  const stockMinimo = useMemo(() => {
    const normalized = stockMinimoInput.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [stockMinimoInput]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.unidad_medida) newErrors.unidad_medida = "La unidad de medida es obligatoria";
    if (stockActual <= 0) newErrors.stock_actual = "El stock actual debe ser mayor a 0";
    if (stockMinimo < 0) newErrors.stock_minimo = "El stock mínimo no puede ser negativo";
    if (stockMinimo >= 0 && stockMinimo >= stockActual) {
      newErrors.stock_minimo = "El stock mínimo debe ser menor al stock actual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setImagePreview(null);
      setImageFile(null);
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

    setImageFile(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.imagen;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateIngredienteData = {
        ...formData,
        stock_actual: Number(stockActual.toFixed(3)),
        stock_minimo: Number(stockMinimo.toFixed(3)),
        imagen: imageFile,
      };

      const created = await createIngrediente(payload);
      onToast("Ingrediente agregado correctamente", "success");
      setFormData({ nombre: "", unidad_medida: "KG", stock_actual: 0, stock_minimo: 0 });
      setStockActualInput("0");
      setStockMinimoInput("0");
      setImagePreview(null);
      setImageFile(null);
      setErrors({});
      onSuccess(created, imagePreview ?? undefined);
    } catch (error: any) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const status = error.response?.status;
        const data = error.response?.data as ApiErrorBody & { error?: string; code?: string };
        const code = data.error ?? data.code;

        if (status === 422 && code === "INGREDIENTE_DUPLICADO") {
          setErrors((prev) => ({ ...prev, nombre: "Ya existe un ingrediente con ese nombre" }));
          return;
        }
      }

      onToast("Error al crear el ingrediente", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px", background: "#fff", padding: "24px", borderRadius: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
      <div style={{ display: "grid", gap: "12px" }}>
        <h2 style={{ margin: 0 }}>Agregar Ingrediente</h2>
      </div>

      <label style={{ display: "grid", gap: "8px" }}>
        Nombre
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej. Tomate Roma"
          style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #d1d5db" }}
        />
        {errors.nombre && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.nombre}</span>}
      </label>

      <label style={{ display: "grid", gap: "8px" }}>
        Unidad de medida
        <select
          value={formData.unidad_medida}
          onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value as UnidadMedida })}
          style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #d1d5db" }}
        >
          {UNIDADES.map((unidad) => (
            <option key={unidad} value={unidad}>
              {unidad}
            </option>
          ))}
        </select>
        {errors.unidad_medida && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.unidad_medida}</span>}
      </label>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <label style={{ display: "grid", gap: "8px" }}>
          Stock actual
          <input
            type="number"
            step="0.001"
            min="0"
            value={stockActualInput}
            onChange={(e) => setStockActualInput(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #d1d5db" }}
          />
          {errors.stock_actual && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.stock_actual}</span>}
        </label>
        <label style={{ display: "grid", gap: "8px" }}>
          Stock mínimo
          <input
            type="number"
            step="0.001"
            min="0"
            value={stockMinimoInput}
            onChange={(e) => setStockMinimoInput(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #d1d5db" }}
          />
          {errors.stock_minimo && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.stock_minimo}</span>}
        </label>
      </div>

      <label style={{ display: "grid", gap: "8px" }}>
        Imagen (opcional)
        <div style={{ display: "grid", gap: "12px" }}>
          <label htmlFor="imagen-input" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "fit-content", padding: "12px 18px", borderRadius: "14px", border: "1px dashed #d1d5db", color: "#0f172a", cursor: "pointer", background: "#fafafa" }}>
            <span>Seleccionar imagen</span>
          </label>
          <input id="imagen-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Vista previa" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "18px", border: "1px solid #e5e7eb" }} />
            ) : (
              <div style={{ width: "120px", height: "120px", display: "grid", placeItems: "center", borderRadius: "18px", background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", textAlign: "center", fontSize: "0.9rem" }}>
                No hay imagen seleccionada
              </div>
            )}
          </div>
          {errors.imagen && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.imagen}</span>}
        </div>
      </label>

      <button type="submit" disabled={isSubmitting} style={{ background: "#d1141f", color: "#fff", border: "none", borderRadius: "12px", padding: "14px 20px", fontWeight: 700, cursor: "pointer" }}>
        {isSubmitting ? "Guardando..." : "Agregar ingrediente"}
      </button>
    </form>
  );
}
