import { useState } from "react";
import { AjusteStockModal } from "./AjusteStockModal";
import type { Ingrediente } from "../types";

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

export function ListaIngredientes({ ingredientes, loading, page, totalPages, onPageChange, totalItems, onAjusteSuccess, onRefresh, canAdjust = true }: Props) {
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null);
  const [showModal, setShowModal] = useState(false);

  const formatNumberSmart = (value: number, maxDecimals: number) => {
    if (!Number.isFinite(value)) return String(value);
    const fixed = value.toFixed(maxDecimals);
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  };

  return (
    <div style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
      <div style={{ padding: "24px 24px 0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: 0 }}>Lista de ingredientes</h2>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>
              Mostrando {ingredientes.length} de {totalItems} ingredientes.
            </p>
          </div>
          <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>
            Página {page} de {totalPages}
          </span>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
            <th style={{ padding: "18px 24px", textAlign: "left", minWidth: "320px" }}>Ingrediente</th>
            <th style={{ padding: "18px 24px", textAlign: "left" }}>Unidad</th>
            <th style={{ padding: "18px 24px", textAlign: "right" }}>Stock actual</th>
            <th style={{ padding: "18px 24px", textAlign: "right" }}>Stock mínimo</th>
            <th style={{ padding: "18px 24px", textAlign: "center" }}>Estado</th>
            <th style={{ padding: "18px 24px", textAlign: "center" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} style={{ padding: "32px", textAlign: "center" }}>
                Cargando ingredientes...
              </td>
            </tr>
          ) : ingredientes.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: "32px", textAlign: "center" }}>
                No hay ingredientes disponibles.
              </td>
            </tr>
          ) : (
            ingredientes.map((ingrediente) => {
              const unidad = ingrediente.unidad_medida ?? ingrediente.unidadMedida ?? "";
              const imageSrc = ingrediente.imagen_url;
              const stockActual = Number(ingrediente.stock_actual ?? (ingrediente as any).stockActual ?? 0);
              const stockMinimo = Number(ingrediente.stock_minimo ?? (ingrediente as any).stockMinimo ?? 0);
              return (
                <tr key={ingrediente.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                    {imageSrc ? (
                      <img src={imageSrc} alt={ingrediente.nombre} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "18px", border: "1px solid #e2e8f0" }} />
                    ) : (
                      <div style={{ width: "72px", height: "72px", display: "grid", placeItems: "center", borderRadius: "18px", background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", fontSize: "0.8rem" }}>
                        IMG
                      </div>
                    )}
                    <span style={{ display: "grid", gap: "4px" }}>
                      <strong>{ingrediente.nombre}</strong>
                    </span>
                  </td>
                  <td style={{ padding: "18px 24px" }}>{unidad}</td>
                  <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 700 }}>
                    {formatNumberSmart(stockActual, 3)}
                  </td>
                  <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 700 }}>
                    {formatNumberSmart(stockMinimo, 3)}
                  </td>
                  <td style={{ padding: "18px 24px", textAlign: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "90px", padding: "8px 12px", borderRadius: "999px", background: ingrediente.activo ? "#e6f7ed" : "#fff0f1", color: ingrediente.activo ? "#047857" : "#b91c1c", fontWeight: 700, fontSize: "0.85rem" }}>
                      {ingrediente.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "18px 24px", textAlign: "center" }}>
                    {canAdjust ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIngrediente(ingrediente);
                          setShowModal(true);
                        }}
                        style={{
                          background: "#d1141f",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                        }}
                      >
                        Ajustar
                      </button>
                    ) : (
                      <span style={{ color: "#98a2b3", fontWeight: 700, fontSize: "0.85rem" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div style={{ padding: "18px 24px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => onPageChange(page - 1)}
          style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", padding: "10px 18px", cursor: page === 1 || loading ? "not-allowed" : "pointer" }}
        >
          Anterior
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(index + 1)}
              style={{
                minWidth: "38px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: index + 1 === page ? "#d1141f" : "#fff",
                color: index + 1 === page ? "#fff" : "#0f172a",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={page === totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", padding: "10px 18px", cursor: page === totalPages || loading ? "not-allowed" : "pointer" }}
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
    </div>
  );
}
