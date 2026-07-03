import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  title,
  headerLeft,
  headerRight,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [enter, setEnter] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setEnter(true));
      return () => cancelAnimationFrame(id);
    }
    if (mounted) {
      setEnter(false);
      const t = setTimeout(() => setMounted(false), 360);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div className={`sheet${enter ? " is-enter" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-grabber" />
        <header className="sheet-header">
          <div className="sheet-action sheet-action-left">{headerLeft}</div>
          <h2 className="sheet-title">{title}</h2>
          <div className="sheet-action sheet-action-right">{headerRight}</div>
        </header>
        <div className="sheet-scroll">{children}</div>
      </div>
    </div>
  );
}
