import { useState, type ChangeEvent, type FormEvent } from "react";
import { buildApiAssetUrl } from "../api/client";
import type { Ingrediente } from "../types";
import { AjusteStockModal } from "./AjusteStockModal";
import { deleteIngrediente, updateIngrediente } from "../services/inventarioService";

type Props = {
  ingredientes: Ingrediente[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  onAjusteSuccess?: (message: string) => void;
  onRefresh?: () => void;
  canAdjust?: boolean;
};

export function ListaIngredientes({
  ingredientes,
  loading,
  page,
  totalPages,
  onPageChange,
  totalItems,
  onAjusteSuccess,
  onRefresh,
  canAdjust = true,
}: Props) {
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatNumberSmart = (value: number, maxDecimals: number) => {
    if (!Number.isFinite(value)) return String(value);
    const fixed = value.toFixed(maxDecimals);
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  };

  return (
    <div className="data-panel">
      <div className="data-panel__header">
        <div>
          <h2>Lista de ingredientes</h2>
          <p>
            Mostrando {ingredientes.length} de {totalItems} ingredientes.
          </p>
        </div>
        <span>
          Página {page} de {totalPages}
        </span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: "320px" }}>Ingrediente</th>
              <th>Unidad</th>
              <th className="text-right">Stock actual</th>
              <th className="text-right">Stock mínimo</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-message">
                  Cargando ingredientes...
                </td>
              </tr>
            ) : ingredientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-message">
                  No hay ingredientes disponibles.
                </td>
              </tr>
            ) : (
              ingredientes.map((ingrediente) => {
                const unidad = ingrediente.unidad_medida ?? ingrediente.unidadMedida ?? "";
                const imageSrc = buildApiAssetUrl(ingrediente.imagen_url);
                const stockActual = Number(ingrediente.stock_actual ?? (ingrediente as any).stockActual ?? 0);
                const stockMinimo = Number(ingrediente.stock_minimo ?? (ingrediente as any).stockMinimo ?? 0);

                return (
                  <tr key={ingrediente.id}>
                    <td>
                      <div className="ingredient-cell">
                        {imageSrc ? (
                          <img src={imageSrc} alt={ingrediente.nombre} className="ingredient-thumb" />
                        ) : (
                          <div className="ingredient-thumb ingredient-thumb--empty">IMG</div>
                        )}
                        <strong>{ingrediente.nombre}</strong>
                      </div>
                    </td>
                    <td>{unidad}</td>
                    <td className="text-right strong-cell">{formatNumberSmart(stockActual, 3)}</td>
                    <td className="text-right strong-cell">{formatNumberSmart(stockMinimo, 3)}</td>
                    <td className="text-center">
                      <span className={`status-pill ${ingrediente.activo ? "status-pill--success" : "status-pill--danger"}`}>
                        {ingrediente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-center">
                      {canAdjust ? (
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIngrediente(ingrediente);
                              setShowModal(true);
                            }}
                            className="table-action"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIngrediente(ingrediente)}
                            className="table-action table-action--secondary"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === ingrediente.id || ingrediente.activo === false}
                            onClick={async () => {
                              if (!window.confirm(`Eliminar ${ingrediente.nombre}?`)) return;
                              setDeletingId(ingrediente.id);
                              try {
                                await deleteIngrediente(ingrediente.id);
                                onAjusteSuccess?.("Ingrediente eliminado correctamente.");
                                onRefresh?.();
                              } catch {
                                onAjusteSuccess?.("No se pudo eliminar el ingrediente.");
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="table-action table-action--danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <span className="muted-cell">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="data-panel__footer">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="pager-button"
        >
          Anterior
        </button>
        <div className="pager-pages">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(index + 1)}
              className={`pager-button pager-button--number ${index + 1 === page ? "pager-button--active" : ""}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={page === totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="pager-button"
        >
          Siguiente
        </button>
      </div>

      {selectedIngrediente && canAdjust && (
        <AjusteStockModal
          ingrediente={selectedIngrediente}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedIngrediente(null);
          }}
          onSuccess={(message) => {
            onAjusteSuccess?.(message);
            onRefresh?.();
            setShowModal(false);
            setSelectedIngrediente(null);
          }}
          onError={(message) => {
            onAjusteSuccess?.(message);
          }}
        />
      )}

      {editingIngrediente && canAdjust ? (
        <EditarIngredienteModal
          ingrediente={editingIngrediente}
          onClose={() => setEditingIngrediente(null)}
          onSuccess={(message) => {
            onAjusteSuccess?.(message);
            onRefresh?.();
            setEditingIngrediente(null);
          }}
        />
      ) : null}
    </div>
  );
}

const UNIDADES = ["KG", "G", "L", "ML", "UNIDAD"] as const;

function EditarIngredienteModal({
  ingrediente,
  onClose,
  onSuccess,
}: {
  ingrediente: Ingrediente;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [nombre, setNombre] = useState(ingrediente.nombre);
  const [unidadMedida, setUnidadMedida] = useState(ingrediente.unidad_medida ?? ingrediente.unidadMedida ?? "KG");
  const [stockActual, setStockActual] = useState(String(ingrediente.stock_actual ?? 0));
  const [stockMinimo, setStockMinimo] = useState(String(ingrediente.stock_minimo ?? 0));
  const [activo, setActivo] = useState(ingrediente.activo !== false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(buildApiAssetUrl(ingrediente.imagen_url));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setImageFile(null);
      setImagePreview(buildApiAssetUrl(ingrediente.imagen_url));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen valido.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen no puede superar 3 MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedStockActual = Number(stockActual.replace(",", "."));
    const parsedStockMinimo = Number(stockMinimo.replace(",", "."));

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!Number.isFinite(parsedStockActual) || parsedStockActual < 0) {
      setError("El stock actual debe ser 0 o mayor.");
      return;
    }
    if (!Number.isFinite(parsedStockMinimo) || parsedStockMinimo < 0) {
      setError("El stock minimo debe ser 0 o mayor.");
      return;
    }

    setSubmitting(true);
    try {
      await updateIngrediente(ingrediente.id, {
        nombre: nombre.trim(),
        unidad_medida: unidadMedida,
        stock_actual: Number(parsedStockActual.toFixed(3)),
        stock_minimo: Number(parsedStockMinimo.toFixed(3)),
        activo,
        imagen: imageFile,
      });
      onSuccess("Ingrediente actualizado correctamente.");
    } catch {
      setError("No se pudo actualizar el ingrediente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Editar ingrediente</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={submitting}>
            &times;
          </button>
        </header>
        <form className="modal-body edit-ingredient-form" onSubmit={handleSubmit}>
          <label className="form-field">
            Nombre
            <input value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </label>

          <label className="form-field">
            Unidad
            <select value={unidadMedida} onChange={(event) => setUnidadMedida(event.target.value)}>
              {UNIDADES.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
          </label>

          <div className="edit-ingredient-grid">
            <label className="form-field">
              Stock actual
              <input type="number" min="0" step="0.001" value={stockActual} onChange={(event) => setStockActual(event.target.value)} />
            </label>
            <label className="form-field">
              Stock minimo
              <input type="number" min="0" step="0.001" value={stockMinimo} onChange={(event) => setStockMinimo(event.target.value)} />
            </label>
          </div>

          <label className="form-field">
            Estado
            <select value={activo ? "true" : "false"} onChange={(event) => setActivo(event.target.value === "true")}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label className="form-field">
            Foto
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
          {imagePreview ? (
            <img src={imagePreview} alt="Vista previa" className="edit-ingredient-preview" />
          ) : (
            <div className="ingredient-thumb ingredient-thumb--empty edit-ingredient-preview">IMG</div>
          )}

          {error ? <div className="form-error">{error}</div> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
