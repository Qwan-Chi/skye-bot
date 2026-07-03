import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "fill" | "glass" | "destructive" | "quiet";

export function Button({
  variant = "fill",
  icon,
  children,
  className = "",
  ...props
}: {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `button button-${variant} ${className}`.trim();
  return (
    <button className={cls} {...props}>
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="sheet-action" onClick={onClick} aria-label="Close">
      <Icon.X />
    </button>
  );
}
