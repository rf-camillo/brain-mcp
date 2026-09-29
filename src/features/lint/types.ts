import type { Note } from "../../vault/note.js";
import type { Vault } from "../../vault/vault.js";

export const ISSUE_KINDS = [
  "invalid_frontmatter",
  "missing_frontmatter",
  "missing_field",
  "broken_link",
  "ambiguous_link",
  "orphan",
  "not_in_index",
  "sensitive",
] as const;

export type IssueKind = (typeof ISSUE_KINDS)[number];

export interface Issue {
  kind: IssueKind;
  path: string;
  line?: number;
  detail: string;
}

export interface LintContext {
  vault: Vault;
  openDiaryPath: string;
  isDiaryNote: (path: string) => boolean;
  indexPath: string;
  indexedPaths: ReadonlySet<string> | null;
}

export type LintRule = (note: Note, context: LintContext) => Issue[];
