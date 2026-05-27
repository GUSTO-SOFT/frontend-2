import { formatCurrency } from "../utils/format";
import type { Producto } from "../types";

type Props = {
  producto: Producto;
};

export function ProductoAtributosCard({ producto }: Props) {
  const tiempo =
    producto.tiempo_preparacion ?? producto.tiempoPreparacion ?? 0;
  const precio = typeof producto.precio === "string" ? Number(producto.precio) : producto.precio;

  return (
    <div className="pedido-card">
      <h2>Atributos del producto</h2>

      <div className="pedido-resumen__header">
        <div>
          <span className="mesa-muted">ID</span>
          <strong>{producto.id}</strong>
        </div>
        <div>
          <span className="mesa-muted">Categoría</span>
          <strong>{producto.categoria}</strong>
        </div>
        <div>
          <span className="mesa-muted">Activo</span>
          <strong>{producto.activo ? "Sí" : "No"}</strong>
        </div>
      </div>

      <div className="pedido-detalles-list">
        <div className="pedido-detalle-item">
          <div>
            <strong>Nombre</strong>
            <span>{producto.nombre}</span>
          </div>
          <div />
          <div />
        </div>
        <div className="pedido-detalle-item">
          <div>
            <strong>Precio</strong>
            <span>{formatCurrency(Number.isFinite(precio) ? precio : 0)}</span>
          </div>
          <div />
          <div />
        </div>
        <div className="pedido-detalle-item">
          <div>
            <strong>Tiempo preparación</strong>
            <span>{tiempo} min</span>
          </div>
          <div />
          <div />
        </div>
        <div className="pedido-detalle-item">
          <div>
            <strong>Creado</strong>
            <span>{String(producto.created_at)}</span>
          </div>
          <div />
          <div />
        </div>
        <div className="pedido-detalle-item">
          <div>
            <strong>Actualizado</strong>
            <span>{String(producto.updated_at)}</span>
          </div>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

