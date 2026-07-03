import type { ReactNode } from "react";

export function TextField({
  value,
  onChange,
  placeholder,
  left,
  mono = false,
  type = "text",
  spellCheck = false,
  autoComplete = "off",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  left?: ReactNode;
  mono?: boolean;
  type?: string;
  spellCheck?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="row row-input">
      {left && <div className="row-label">{left}</div>}
      <input
        className={`field${mono ? " field-mono" : ""}`}
        type={type}
        value={value}
        placeholder={placeholder}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
  large = false,
  mono = false,
  spellCheck = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  large?: boolean;
  mono?: boolean;
  spellCheck?: boolean;
}) {
  return (
    <div className="row no-sep">
      <textarea
        className={`field textarea${large ? " textarea-lg" : ""}${mono ? " field-mono" : ""}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        spellCheck={spellCheck}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
