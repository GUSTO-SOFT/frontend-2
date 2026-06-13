import { useEffect, useState } from "react";
import { getIngredientes } from "../services/menuService";
import type { Ingrediente, ProductIngredientInput } from "../types";

type Props = {
  selectedIngredientes: ProductIngredientInput[];
  onChange: (ingredientes: ProductIngredientInput[]) => void;
  error?: string;
};

export function IngredientesMultiSelect({ selectedIngredientes, onChange, error }: Props) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIngredientes()
      .then(setIngredientes)
      .finally(() => setLoading(false));
  }, []);

  const selectedIds = selectedIngredientes.map((item) => item.ingrediente_id);

  const addIngrediente = () => {
    const next = ingredientes.find((item) => !selectedIds.includes(item.id));
    if (!next) return;
    onChange([...selectedIngredientes, { ingrediente_id: next.id, cantidad: 1 }]);
  };

  const updateIngrediente = (index: number, ingredienteId: number) => {
    onChange(
      selectedIngredientes.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ingrediente_id: ingredienteId } : item,
      ),
    );
  };

  const updateCantidad = (index: number, cantidad: number) => {
    onChange(
      selectedIngredientes.map((item, itemIndex) =>
        itemIndex === index ? { ...item, cantidad } : item,
      ),
    );
  };

  const removeIngrediente = (index: number) => {
    onChange(selectedIngredientes.filter((_, itemIndex) => itemIndex !== index));
  };

  if (loading) return <p className="mesa-muted">Cargando ingredientes...</p>;

  return (
    <div className="form-field">
      <label>Ingredientes</label>
      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "16px",
          border: error ? "1px solid #d1141f" : "1px solid #d8deea",
          borderRadius: "14px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 130px 40px",
            gap: "10px",
            color: "#667085",
            fontSize: "0.78rem",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          <span>Ingrediente</span>
          <span>Cantidad</span>
          <span />
        </div>

        {selectedIngredientes.length === 0 ? (
          <p className="mesa-muted">Agrega los ingredientes que usa este producto.</p>
        ) : (
          selectedIngredientes.map((selected, index) => {
            const options = ingredientes.filter(
              (item) => item.id === selected.ingrediente_id || !selectedIds.includes(item.id),
            );

            return (
              <div
                key={`${selected.ingrediente_id}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 130px 40px",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <select
                  value={selected.ingrediente_id}
                  onChange={(event) => updateIngrediente(index, Number(event.target.value))}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    border: "1px solid #d8deea",
                    borderRadius: "12px",
                    padding: "0 12px",
                    background: "#fff",
                  }}
                >
                  {options.map((ingrediente) => (
                    <option key={ingrediente.id} value={ingrediente.id}>
                      {ingrediente.nombre}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={selected.cantidad || ""}
                  onChange={(event) => updateCantidad(index, Number(event.target.value))}
                  placeholder="Cantidad"
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    border: "1px solid #d8deea",
                    borderRadius: "12px",
                    padding: "0 12px",
                  }}
                />

                <button
                  type="button"
                  onClick={() => removeIngrediente(index)}
                  aria-label="Quitar ingrediente"
                  title="Quitar ingrediente"
                  style={{
                    width: "40px",
                    minHeight: "40px",
                    border: "1px solid #fecdca",
                    borderRadius: "10px",
                    background: "#fff5f5",
                    color: "#b42318",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  x
                </button>
              </div>
            );
          })
        )}

        <button
          type="button"
          onClick={addIngrediente}
          disabled={selectedIngredientes.length >= ingredientes.length}
          className="secondary-button"
          style={{
            width: "fit-content",
            minHeight: "42px",
            padding: "0 16px",
          }}
        >
          + Agregar ingrediente
        </button>
        {ingredientes.length === 0 ? (
          <span className="mesa-muted">Primero crea ingredientes en Inventario.</span>
        ) : null}
      </div>
      {error && <span className="error-text" style={{ color: "#d1141f", fontSize: "0.85rem", marginTop: "4px" }}>{error}</span>}
    </div>
  );
}
