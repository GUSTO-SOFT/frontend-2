type Props = {
  value: number;
  max: number;
};

export function ContadorCaracteres({ value, max }: Props) {
  const remaining = Math.max(0, max - value);
  return <span className={`char-counter${remaining === 0 ? " char-counter--limit" : ""}`}>{`${remaining}/${max}`}</span>;
}
