import { VaultError } from "../../core/errors.js";
import { readIfExists } from "../../core/fs.js";
import type { Vault } from "../../vault/vault.js";

export async function newDayContent(vault: Vault, day: string): Promise<string> {
  const template = vault.config.diary.template;
  if (template === null) return `---\ntype: diary\ndate: ${day}\n---\n\n# ${day}\n`;

  const text = await readIfExists(await vault.absolutePath(template));
  if (text === null) throw new VaultError("NOT_FOUND", `Diary template ${template} does not exist`);
  return `${text.replaceAll("{{date}}", day).trimEnd()}\n`;
}
