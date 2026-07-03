export function Switch({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`switch${on ? " is-on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
    >
      <span className="switch-thumb" />
    </button>
  );
}
