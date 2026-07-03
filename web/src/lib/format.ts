export function fmtTokens(n: number | undefined | null): string {
  return Number(n || 0).toLocaleString("en-US");
}

export function formatDate(iso: string | number | undefined): string {
  if (iso == null) return "";
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso ?? "");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeSeconds(seconds: number): string {
  if (!seconds) return "";
  const days = Math.round(seconds / 86_400);
  if (days >= 30) {
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""}`;
  const hours = Math.round(seconds / 3600);
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}
