import { isoDate } from "../../core/dates.js";
import { isUnderFolder } from "../../core/files.js";
import type { Vault } from "../../vault/vault.js";
import { diaryPath, diaryPathPattern } from "../diary/diary-path.js";
import { frontmatterRule } from "./rules/frontmatter.js";
import { indexCoverageRule } from "./rules/index-coverage.js";
import { linksRule } from "./rules/links.js";
import { orphanRule } from "./rules/orphans.js";
import { sensitiveRule } from "./rules/sensitive.js";
import {
  type Issue,
  ISSUE_KINDS,
  type IssueKind,
  type LintContext,
  type LintRule,
} from "./types.js";

const RULES: readonly LintRule[] = [
  frontmatterRule,
  linksRule,
  orphanRule,
  indexCoverageRule,
  sensitiveRule,
];

export interface LintOptions {
  kinds?: readonly IssueKind[] | undefined;
  folder?: string | undefined;
  now: Date;
}

export interface LintReport {
  checked: number;
  total: number;
  counts: Partial<Record<IssueKind, number>>;
  issues: Issue[];
}

function createContext(vault: Vault, now: Date): LintContext {
  const { index, diary } = vault.config;
  const hasIndex = vault.notes().some((note) => note.path === index.path);
  const diaryPattern = diaryPathPattern(diary.path);
  return {
    vault,
    openDiaryPath: diaryPath(diary.path, isoDate(now)),
    isDiaryNote: (path) => diaryPattern.test(path),
    indexPath: index.path,
    indexedPaths: hasIndex ? vault.graph.linkedTargets(index.path) : null,
  };
}

function compareIssues(a: Issue, b: Issue): number {
  return (
    ISSUE_KINDS.indexOf(a.kind) - ISSUE_KINDS.indexOf(b.kind) ||
    a.path.localeCompare(b.path) ||
    (a.line ?? 0) - (b.line ?? 0)
  );
}

function countByKind(issues: readonly Issue[]): Partial<Record<IssueKind, number>> {
  const counts: Partial<Record<IssueKind, number>> = {};
  for (const { kind } of issues) counts[kind] = (counts[kind] ?? 0) + 1;
  return counts;
}

export function runLint(vault: Vault, options: LintOptions): LintReport {
  const wanted = new Set<IssueKind>(options.kinds ?? ISSUE_KINDS);
  const context = createContext(vault, options.now);
  const notes = vault.notes().filter((note) => isUnderFolder(note.path, options.folder ?? ""));
  const issues = notes
    .flatMap((note) => RULES.flatMap((rule) => rule(note, context)))
    .filter((issue) => wanted.has(issue.kind))
    .sort(compareIssues);
  return { checked: notes.length, total: issues.length, counts: countByKind(issues), issues };
}
