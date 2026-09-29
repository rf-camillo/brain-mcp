import type { AnyTool } from "../tools/define-tool.js";
import {
  diaryAddTool,
  indexBuildTool,
  noteCreateTool,
  noteLinksTool,
  noteReadTool,
  noteSearchTool,
  vaultIndexTool,
  vaultLintTool,
} from "../tools/index.js";
import { integerFlag, jsonObjectFlag, omitUndefined, required } from "./args.js";
import type { CliValues } from "./options.js";

export interface Command {
  tool: AnyTool;
  args: (rest: string[], values: CliValues) => Record<string, unknown>;
  failed?: (result: Record<string, unknown>) => boolean;
}

export const COMMANDS: Readonly<Record<string, Command>> = {
  index: {
    tool: vaultIndexTool,
    args: (_, values) =>
      omitUndefined({
        type: values.type,
        folder: values.folder,
        limit: integerFlag(values.limit, "limit"),
        offset: integerFlag(values.offset, "offset"),
      }),
  },
  search: {
    tool: noteSearchTool,
    args: (rest, values) =>
      omitUndefined({
        query: required(rest.join(" "), "search query"),
        type: values.type,
        folder: values.folder,
        limit: integerFlag(values.limit, "limit"),
      }),
  },
  read: {
    tool: noteReadTool,
    args: (rest, values) =>
      omitUndefined({
        ref: required(rest.join(" "), "note reference"),
        section: values.section,
        maxChars: integerFlag(values["max-chars"], "max-chars"),
      }),
  },
  links: {
    tool: noteLinksTool,
    args: (rest) => ({ ref: required(rest.join(" "), "note reference") }),
  },
  lint: {
    tool: vaultLintTool,
    args: (_, values) => omitUndefined({ kinds: values.kind, folder: values.folder }),
    failed: (result) => result.total !== 0,
  },
  diary: {
    tool: diaryAddTool,
    args: (rest, values) =>
      omitUndefined({
        text: required(rest.join(" "), "diary text"),
        section: values.section,
        date: values.date,
        time: values["no-time"] !== true,
      }),
  },
  create: {
    tool: noteCreateTool,
    args: (rest, values) =>
      omitUndefined({
        path: required(rest[0], "note path"),
        frontmatter: jsonObjectFlag(values.frontmatter, "frontmatter"),
        body: values.body,
      }),
  },
  "build-index": {
    tool: indexBuildTool,
    args: (_, values) => ({ dryRun: values["dry-run"] === true }),
  },
};
