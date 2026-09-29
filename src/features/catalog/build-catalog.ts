import type { Vault } from "../../vault/vault.js";
import { renderCatalog } from "./render-catalog.js";

export interface BuildCatalogResult {
  path: string;
  notes: number;
  written: boolean;
  content?: string;
}

export async function buildCatalog(
  vault: Vault,
  options: { dryRun: boolean },
): Promise<BuildCatalogResult> {
  const { text, count } = renderCatalog(vault);
  const indexPath = vault.config.index.path;
  if (options.dryRun) {
    return { path: indexPath, notes: count, written: false, content: text };
  }
  vault.writer.assertSafe(text, indexPath);
  const target = await vault.writer.target(indexPath);
  const { changed } = await vault.writer.update(target, () => text);
  return { path: target.vaultPath, notes: count, written: changed };
}
