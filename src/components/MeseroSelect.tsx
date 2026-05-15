import { useEffect, useState } from "react";
import { getMeserosActivos } from "../services/usuariosService";
import type { Usuario } from "../types";

type Props = {
  value: number | "";
  onChange: (id: number) => void;
  disabled?: boolean;
};

export function MeseroSelect({ value, onChange, disabled }: Props) {
  const [meseros, setMeseros] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeserosActivos()
      .then((data) => {
        setMeseros(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError("Error al cargar meseros");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="mesa-muted">Cargando meseros...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="form-field">
      <label htmlFor="mesero-select">Seleccionar Mesero</label>
      <select
        id="mesero-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="form-select"
        style={{
          width: "100%",
          minHeight: "48px",
          border: "1px solid #d8deea",
          borderRadius: "14px",
          padding: "0 16px",
          fontSize: "1rem",
          background: "#fff"
        }}
      >
        <option value="" disabled>
          -- Seleccione un mesero --
        </option>
        {Array.isArray(meseros) && meseros.map((mesero) => (
          <option key={mesero.id} value={mesero.id}>
            {mesero.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
