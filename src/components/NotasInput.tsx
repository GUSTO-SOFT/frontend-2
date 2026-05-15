import { ContadorCaracteres } from "./ContadorCaracteres";

type Props = {
  value: string;
  max: number;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: string) => void;
};

export function NotasInput({ value, max, disabled = false, error, onChange }: Props) {
  const tooLong = value.length > max;
  const finalError = error ?? (tooLong ? `Maximo ${max} caracteres.` : null);

  return (
    <div className="notas-input">
      <div className="notas-input__header">
        <span className="notas-input__label">Notas</span>
        <ContadorCaracteres value={value.length} max={max} />
      </div>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`notas-input__field${finalError ? " notas-input__field--error" : ""}`}
        rows={2}
        maxLength={max + 50}
      />
      {finalError ? <span className="inline-error">{finalError}</span> : null}
    </div>
  );
}
