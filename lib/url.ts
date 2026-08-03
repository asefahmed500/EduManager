export function buildUrl(
  base: string,
  current: URLSearchParams,
  overrides: Record<string, string>,
): string {
  const p = new URLSearchParams(current);
  for (const [key, value] of Object.entries(overrides)) {
    if (value) p.set(key, value);
    else p.delete(key);
  }
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}
