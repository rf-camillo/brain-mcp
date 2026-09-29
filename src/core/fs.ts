import { readFile } from "node:fs/promises";

export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === code;
}

export async function readIfExists(absolute: string): Promise<string | null> {
  try {
    return await readFile(absolute, "utf8");
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return null;
    throw error;
  }
}
