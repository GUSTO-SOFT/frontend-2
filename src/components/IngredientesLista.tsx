import type { Ingrediente } from "../types";

type Props = {
  ingredientes: Ingrediente[];
};

export function IngredientesLista({ ingredientes }: Props) {
  return (
    <div className="pedido-card">
      <h2>Ingredientes</h2>

      {ingredientes.length === 0 ? (
        <p className="mesa-muted">Este producto no tiene ingredientes asociados.</p>
      ) : (
        <div className="pedido-detalles-list">
          {ingredientes.map((ing) => {
            const unidad = ing.unidad_medida ?? ing.unidadMedida ?? "";
            return (
              <div key={ing.id} className="pedido-detalle-item">
                <div>
                  <strong>{ing.nombre}</strong>
                  <span>{unidad || "Sin unidad"}</span>
                </div>
                <div />
                <div />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
