import type { ReactNode } from "react";
import { Icon, type IconColor, type IconType } from "./Icon";

export function Section({ children }: { children: ReactNode }) {
  return <div className="section">{children}</div>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <div className="caption">{children}</div>;
}

export function Footnote({ children }: { children: ReactNode }) {
  return <p className="footnote">{children}</p>;
}

export function LargeTitle({ children }: { children: ReactNode }) {
  return <h1 className="large-title">{children}</h1>;
}

export function Badge({ icon: I, color }: { icon: IconType; color: IconColor }) {
  return (
    <span className={`badge ${color}`}>
      <I />
    </span>
  );
}

export function Chevron({ destructive = false }: { destructive?: boolean }) {
  return (
    <span className="chevron" style={destructive ? { color: "var(--destructive)", opacity: 0.7 } : undefined}>
      <Icon.ChevronRight />
    </span>
  );
}

export function EmptyState({
  icon: I,
  title,
  sub,
}: {
  icon: IconType;
  title: string;
  sub?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <I />
      </div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

export function Spinner({ large = false }: { large?: boolean }) {
  return <div className={`spinner${large ? " spinner-lg" : ""}`} />;
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <div className="hint-row">
      <Icon.Info />
      <span>{children}</span>
    </div>
  );
}
