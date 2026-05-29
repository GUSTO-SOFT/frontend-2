import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { DescuentoModal } from "../components/DescuentoModal";
import { CerrarCuentaModal } from "../components/CerrarCuentaModal";
import { getCuentaMesa, cerrarCuenta } from "../services/billingService";
import { formatCurrency } from "../utils/format";
import type { ApiErrorBody, Cuenta, Mesa } from "../types";
import { useAuth } from "../auth/AuthContext";

type Props = {
  mesa: Mesa;
  onVolver: () => void;
  onCuentaCerrada: () => void;
};

export function CuentaMesaPage({ mesa, onVolver, onCuentaCerrada }: Props) {
  const { rol } = useAuth();
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showDescuentoModal, setShowDescuentoModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [sinItems, setSinItems] = useState(false);
  const [isCerrando, setIsCerrando] = useState(false);

  const fetchCuenta = useCallback(async () => {
    setLoading(true);
    setSinItems(false);
    try {
      const data = await getCuentaMesa(mesa.id);
      setCuenta(data);
    } catch (error: any) {
      const code = error.response?.data?.error;
      if (code === "CUENTA_SIN_ITEMS") {
        setSinItems(true);
      } else {
        setToast("No se pudo cargar la cuenta");
      }
    } finally {
      setLoading(false);
    }
  }, [mesa.id]);

  useEffect(() => {
    void fetchCuenta();
  }, [fetchCuenta]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleConfirmarCerrarCuenta = async () => {
    if (!cuenta) return;
    setIsCerrando(true);
    try {
      await cerrarCuenta(cuenta.id);
      setToast("Cuenta cerrada correctamente");
      onCuentaCerrada();
    } catch (error: any) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const status = error.response?.status;
        const code = error.response?.data?.error;

        if (status === 409 || code === "CUENTA_YA_CERRADA") {
          setToast("Esta cuenta ya está cerrada");
          // Volvemos a cargar la cuenta para actualizar el estado
          await fetchCuenta();
          return;
        }
      }
      const message = error.response?.data?.message || "Error al cerrar la cuenta";
      setToast(message);
    } finally {
      setIsCerrando(false);
      setShowCerrarModal(false);
    }
  };

  const canManageCuenta = rol === "ADMIN" || rol === "CAJERO";

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <header className="topbar">
          <button
            type="button"
            className="secondary-button"
            onClick={onVolver}
            style={{ padding: "8px 16px" }}
          >
            ← Volver a mesas
          </button>
          <h1>Cuenta - Mesa {mesa.numero}</h1>
          <div className="session-user" />
        </header>

        <section className="content">
          {loading ? (
            <div className="empty-state">
              <h2>Cargando cuenta...</h2>
            </div>
          ) : sinItems ? (
            <div className="empty-state">
              <h2>Sin items para facturar</h2>
              <p>Esta mesa no tiene pedidos entregados para facturar.</p>
            </div>
          ) : !cuenta ? (
            <div className="empty-state">
              <h2>No hay cuenta disponible</h2>
            </div>
          ) : (
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
              {/* Lista de items */}
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "16px" }}>Items Consumidos</h2>
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                  {cuenta.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: index < cuenta.items.length - 1 ? "1px solid #eee" : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold" }}>{item.producto}</div>
                        <div style={{ color: "#666", fontSize: "14px" }}>
                          {item.cantidad} x {formatCurrency(item.precio_unitario)}
                        </div>
                      </div>
                      <div style={{ fontWeight: "bold" }}>{formatCurrency(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div style={{ background: "#f8f8f8", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(cuenta.total_bruto - cuenta.impuestos)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Impuestos (19%)</span>
                  <span>{formatCurrency(cuenta.impuestos)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
                  <span>Total Bruto</span>
                  <span>{formatCurrency(cuenta.total_bruto)}</span>
                </div>
                {cuenta.descuento > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "#d1141f" }}>
                      <span>
                        Descuento {cuenta.descuento_tipo === "PORCENTAJE" ? "%" : "$"}
                        {cuenta.descuento_motivo && ` - ${cuenta.descuento_motivo}`}
                      </span>
                      <span>-{formatCurrency(cuenta.descuento)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", borderTop: "2px solid #333", paddingTop: "12px", fontSize: "18px", fontWeight: "bold" }}>
                  <span>Total Neto</span>
                  <span>{formatCurrency(cuenta.total_neto)}</span>
                </div>
              </div>

              {/* Botones de acción */}
              {canManageCuenta && cuenta.estado === "ABIERTA" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowDescuentoModal(true)}
                    disabled={isCerrando}
                  >
                    Aplicar Descuento
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setShowCerrarModal(true)}
                    disabled={isCerrando}
                    style={{ background: "#d1141f", borderColor: "#d1141f" }}
                  >
                    {isCerrando ? "Cerrando..." : "Cerrar Cuenta"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {toast && <Toast message={toast} />}

        {showDescuentoModal && cuenta && (
          <DescuentoModal
            cuenta={cuenta}
            onClose={() => setShowDescuentoModal(false)}
            onSuccess={(updatedCuenta) => {
              setCuenta(updatedCuenta);
              setToast("Descuento aplicado correctamente");
            }}
            onError={setToast}
          />
        )}

        {showCerrarModal && cuenta && (
          <CerrarCuentaModal
            cuenta={cuenta}
            isLoading={isCerrando}
            onClose={() => setShowCerrarModal(false)}
            onConfirm={handleConfirmarCerrarCuenta}
          />
        )}
      </main>
    </div>
  );
}
