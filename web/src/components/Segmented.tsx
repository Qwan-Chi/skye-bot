import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Segment<T>[];
  onChange: (v: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const idx = options.findIndex((o) => o.value === value);
    const btn = root.querySelectorAll<HTMLButtonElement>(".segmented-btn")[idx];
    if (btn) setThumb({ x: btn.offsetLeft, w: btn.offsetWidth });
  }, [value, options]);

  return (
    <div className="segmented" ref={ref}>
      <div
        className="segmented-thumb"
        style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segmented-btn"
          onClick={() => onChange(o.value)}
          style={o.value === value ? { color: "var(--accent)" } : undefined}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
