export function matchesSearchText(query: string, ...parts: Array<string | undefined | null>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => typeof part === 'string' && part.toLowerCase().includes(needle));
}
