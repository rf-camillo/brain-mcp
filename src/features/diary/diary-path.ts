export function diaryPath(pattern: string, day: string): string {
  const [yyyy = "", mm = "", dd = ""] = day.split("-");
  return pattern.replaceAll("{yyyy}", yyyy).replaceAll("{mm}", mm).replaceAll("{dd}", dd);
}

export function diaryPathPattern(pattern: string): RegExp {
  const source = pattern
    .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
    .replaceAll("{yyyy}", "\\d{4}")
    .replaceAll("{mm}", "\\d{2}")
    .replaceAll("{dd}", "\\d{2}");
  return new RegExp(`^${source}$`);
}
