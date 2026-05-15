import { useEffect, useState } from "react";
import { getIngredientes } from "../services/menuService";
import type { Ingrediente } from "../types";

type Props = {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
};

export function IngredientesMultiSelect({ selectedIds, onChange, error }: Props) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIngredientes()
      .then(setIngredientes)
      .finally(() => setLoading(false));
  }, []);

  const toggleIngrediente = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) return <p className="mesa-muted">Cargando ingredientes...</p>;

  return (
    <div className="form-field">
      <label>Ingredientes</label>
      <div 
        className="ingredientes-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "10px",
          padding: "16px",
          border: error ? "1px solid #d1141f" : "1px solid #d8deea",
          borderRadius: "14px",
          background: "#fff",
          maxHeight: "200px",
          overflowY: "auto"
        }}
      >
        {ingredientes.map((ing) => (
          <label 
            key={ing.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              padding: "6px 10px",
              borderRadius: "8px",
              background: selectedIds.includes(ing.id) ? "#fff0f1" : "transparent",
              border: selectedIds.includes(ing.id) ? "1px solid #d1141f" : "1px solid transparent",
              transition: "all 0.2s"
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(ing.id)}
              onChange={() => toggleIngrediente(ing.id)}
              style={{ accentColor: "#d1141f" }}
            />
            {ing.nombre}
          </label>
        ))}
      </div>
      {error && <span className="error-text" style={{ color: "#d1141f", fontSize: "0.85rem", marginTop: "4px" }}>{error}</span>}
    </div>
  );
}
