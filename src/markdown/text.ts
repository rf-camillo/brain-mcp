export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function words(text: string): string[] {
  const all = fold(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
  return [...new Set(all)];
}
