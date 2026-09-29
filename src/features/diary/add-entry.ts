import { clockTime, isoDate } from "../../core/dates.js";
import { VaultError } from "../../core/errors.js";
import type { Vault } from "../../vault/vault.js";
import { diaryPath } from "./diary-path.js";
import { insertEntry } from "./insert-entry.js";
import { newDayContent } from "./new-day.js";

export interface DiaryEntryInput {
  text: string;
  section?: string | undefined;
  date?: string | undefined;
  withTime: boolean;
  now: Date;
}

export interface DiaryEntryResult {
  path: string;
  section: string | null;
  entry: string;
  created: boolean;
}

function canonicalSection(sections: readonly string[], section: string | undefined): string | null {
  if (sections.length === 0) return section ?? null;
  const match = sections.find((name) => name.toLowerCase() === section?.toLowerCase());
  if (match !== undefined) return match;
  const reason = section === undefined ? "Choose a section" : `Unknown section "${section}"`;
  throw new VaultError("INVALID_INPUT", `${reason}. Choose one of: ${sections.join(", ")}`);
}

export async function addDiaryEntry(
  vault: Vault,
  input: DiaryEntryInput,
): Promise<DiaryEntryResult> {
  const { sections, path: pattern } = vault.config.diary;
  const section = canonicalSection(sections, input.section);
  const line = input.text.replace(/\s*\n\s*/g, " ");
  vault.writer.assertSafe(line, "this diary entry");

  const day = input.date ?? isoDate(input.now);
  const entry = `- ${input.withTime ? `${clockTime(input.now)} ` : ""}${line}`;
  const target = await vault.writer.target(diaryPath(pattern, day));
  const { created } = await vault.writer.update(target, async (existing) =>
    insertEntry(existing ?? (await newDayContent(vault, day)), entry, section, sections),
  );
  return { path: target.vaultPath, section, entry, created };
}
