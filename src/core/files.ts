export const MARKDOWN_EXTENSION = ".md";

const MARKDOWN = /\.md$/i;

export function isMarkdownFile(path: string): boolean {
  return MARKDOWN.test(path.trim());
}

export function withoutMarkdownExtension(path: string): string {
  return path.replace(MARKDOWN, "");
}

export function withMarkdownExtension(path: string): string {
  return isMarkdownFile(path) ? path : `${path}${MARKDOWN_EXTENSION}`;
}

export function fileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function topFolder(path: string): string {
  return path.includes("/") ? (path.split("/")[0] ?? "") : "";
}

export function normalizeFolder(folder: string): string {
  return folder.replace(/\\/g, "/").replace(/^\.?\/+|\/+$/g, "");
}

export function isUnderFolder(path: string, folder: string): boolean {
  const normalized = normalizeFolder(folder);
  return normalized === "" || path.startsWith(`${normalized}/`);
}
