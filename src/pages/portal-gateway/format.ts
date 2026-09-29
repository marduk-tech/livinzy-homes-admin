export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function ms(value: number | null | undefined): string {
  if (value == null) return "—";
  const s = Math.round(value / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
