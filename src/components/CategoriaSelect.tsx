import type { CategoriaProducto } from "../types";

type Props = {
  value: CategoriaProducto | "";
  onChange: (value: CategoriaProducto) => void;
  error?: string;
};

const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "PLATO_FUERTE", label: "Plato Fuerte" },
  { value: "BEBIDA", label: "Bebida" },
  { value: "POSTRE", label: "Postre" },
];

export function CategoriaSelect({ value, onChange, error }: Props) {
  return (
    <div className="form-field">
      <label htmlFor="categoria-select">Categoría del Platillo</label>
      <select
        id="categoria-select"
        value={value}
        onChange={(e) => onChange(e.target.value as CategoriaProducto)}
        className={`form-select ${error ? "form-input--error" : ""}`}
        style={{
          width: "100%",
          minHeight: "48px",
          border: error ? "1px solid #d1141f" : "1px solid #d8deea",
          borderRadius: "14px",
          padding: "0 16px",
          fontSize: "1rem",
          background: "#fff"
        }}
      >
        <option value="" disabled>Seleccionar categoría...</option>
        {CATEGORIAS.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      {error && <span className="error-text" style={{ color: "#d1141f", fontSize: "0.85rem", marginTop: "4px" }}>{error}</span>}
    </div>
  );
}
