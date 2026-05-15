type Props = {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  error?: string | null;
};

export function CantidadInput({ value, disabled = false, onChange, error }: Props) {
  return (
    <div className="cantidad-input-wrapper">
      <input
        type="number"
        min={0}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        className={`cantidad-input${error ? " cantidad-input--error" : ""}`}
      />
      {error ? <span className="inline-error">{error}</span> : null}
    </div>
  );
}
