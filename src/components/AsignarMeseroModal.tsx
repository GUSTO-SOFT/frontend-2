import { useState } from "react";
import type { Mesa } from "../types";
import { MeseroSelect } from "./MeseroSelect";
import { asignarMesero } from "../services/mesasService";

type Props = {
  mesa: Mesa;
  onClose: () => void;
  onSuccess: (mesa: Mesa) => void;
  onError: (message: string) => void;
};

export function AsignarMeseroModal({ mesa, onClose, onSuccess, onError }: Props) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId === "") return;

    setIsSubmitting(true);
    try {
      const updatedMesa = await asignarMesero(mesa.id, selectedId);
      onSuccess(updatedMesa);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al asignar mesero";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Asignar Mesero - Mesa {mesa.numero}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </header>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <MeseroSelect 
            value={selectedId} 
            onChange={setSelectedId} 
            disabled={isSubmitting} 
          />
          
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
              disabled={isSubmitting || selectedId === ""}
            >
              {isSubmitting ? "Asignando..." : "Confirmar Asignación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
