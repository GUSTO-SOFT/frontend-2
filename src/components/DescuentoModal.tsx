import { useState } from "react";
import type { Cuenta, DescuentoTipo } from "../types";
import { aplicarDescuento } from "../services/billingService";

type Props = {
  cuenta: Cuenta;
  onClose: () => void;
  onSuccess: (cuenta: Cuenta) => void;
  onError: (message: string) => void;
};

export function DescuentoModal({ cuenta, onClose, onSuccess, onError }: Props) {
  const [tipo, setTipo] = useState<DescuentoTipo>("PORCENTAJE");
  const [valor, setValor] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorValor, setErrorValor] = useState<string | null>(null);
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValor(null);
    setErrorMotivo(null);

    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      setErrorValor("El valor del descuento es obligatorio y debe ser mayor a 0");
      return;
    }

    if (!motivo.trim()) {
      setErrorMotivo("El motivo es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedCuenta = await aplicarDescuento(cuenta.id, { tipo, valor: valorNum, motivo: motivo.trim() });
      onSuccess(updatedCuenta);
      onClose();
    } catch (error: any) {
      const code = error.response?.data?.error;
      if (code === "DESCUENTO_INVALIDO") {
        setErrorValor("El descuento porcentual debe estar entre 0 y 100");
      } else if (code === "DESCUENTO_MAYOR_QUE_TOTAL") {
        setErrorValor("El descuento no puede superar el total bruto");
      } else if (code === "MOTIVO_REQUERIDO") {
        setErrorMotivo("El motivo es obligatorio");
      } else {
        const message = error.response?.data?.message || "Error al aplicar descuento";
        onError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Aplicar Descuento</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </header>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tipo de Descuento</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="PORCENTAJE" 
                  checked={tipo === "PORCENTAJE"} 
                  onChange={() => setTipo("PORCENTAJE")} 
                  disabled={isSubmitting}
                />
                Porcentaje (%)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="VALOR_FIJO" 
                  checked={tipo === "VALOR_FIJO"} 
                  onChange={() => setTipo("VALOR_FIJO")} 
                  disabled={isSubmitting}
                />
                Valor Fijo ($)
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              {tipo === "PORCENTAJE" ? "Porcentaje" : "Valor"}
            </label>
            <input 
              type="number" 
              step={tipo === "PORCENTAJE" ? "1" : "0.01"} 
              min="0" 
              value={valor} 
              onChange={(e) => setValor(e.target.value)} 
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errorValor ? '#d1141f' : '#ddd'}`,
                borderRadius: '6px'
              }}
            />
            {errorValor && <p style={{ color: '#d1141f', margin: '4px 0 0 0', fontSize: '14px' }}>{errorValor}</p>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Motivo</label>
            <textarea 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)} 
              disabled={isSubmitting}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${errorMotivo ? '#d1141f' : '#ddd'}`,
                borderRadius: '6px',
                resize: 'none'
              }}
            />
            {errorMotivo && <p style={{ color: '#d1141f', margin: '4px 0 0 0', fontSize: '14px' }}>{errorMotivo}</p>}
          </div>
          
          <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="primary-button" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Aplicando..." : "Aplicar Descuento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
