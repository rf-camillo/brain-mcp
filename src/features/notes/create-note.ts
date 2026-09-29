import { VaultError } from "../../core/errors.js";
import { fileName, withMarkdownExtension, withoutMarkdownExtension } from "../../core/files.js";
import { type Frontmatter, missingFields, serializeNote } from "../../markdown/frontmatter.js";
import { startsWithHeading } from "../../markdown/title.js";
import { extractLinks } from "../../markdown/wikilinks.js";
import type { Vault } from "../../vault/vault.js";

export interface CreateNoteInput {
  path: string;
  frontmatter: Frontmatter;
  body: string;
}

export interface CreateNoteResult {
  path: string;
  title: string;
  warnings: string[];
}

function linkWarnings(vault: Vault, title: string, body: string): string[] {
  const warnings: string[] = [];
  if (vault.resolve(title).status !== "missing") {
    warnings.push(
      `Another file is already named "${title}"; wikilinks to [[${title}]] become ambiguous.`,
    );
  }
  for (const { target } of extractLinks(body)) {
    const resolution = vault.resolve(target);
    if (resolution.status === "missing") warnings.push(`Link [[${target}]] has no target yet.`);
    if (resolution.status === "ambiguous") {
      warnings.push(`Link [[${target}]] is ambiguous: ${resolution.candidates.join(", ")}.`);
    }
  }
  return warnings;
}

export async function createNote(vault: Vault, input: CreateNoteInput): Promise<CreateNoteResult> {
  const missing = missingFields(input.frontmatter, vault.config.frontmatter.required);
  if (missing.length > 0) {
    throw new VaultError(
      "INVALID_FRONTMATTER",
      `Missing required frontmatter: ${missing.join(", ")}`,
    );
  }

  const path = withMarkdownExtension(input.path);
  const title = withoutMarkdownExtension(fileName(path));
  const body = startsWithHeading(input.body) ? input.body : `# ${title}\n\n${input.body}`;
  const text = serializeNote(input.frontmatter, body);
  vault.writer.assertSafe(text, path);

  const target = await vault.writer.target(path);
  const warnings = linkWarnings(vault, title, body);
  await vault.writer.create(target, text);
  return { path: target.vaultPath, title, warnings };
}
