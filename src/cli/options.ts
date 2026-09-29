import { parseArgs } from "node:util";

export const USAGE = `Usage: brain [--vault <path>] [--read-only] <command> [options]

Commands:
  index [--type T] [--folder F] [--limit N] [--offset N]
  search <query> [--type T] [--folder F] [--limit N]
  read <ref> [--section S] [--max-chars N]
  links <ref>
  lint [--kind K]... [--folder F]        exits with 1 when issues are found
  diary <text> [--section S] [--date YYYY-MM-DD] [--no-time]
  create <path> --frontmatter <json> [--body <markdown>]
  build-index [--dry-run]

The vault defaults to $BRAIN_VAULT, then the current directory. Every command prints JSON.`;

const OPTIONS = {
  vault: { type: "string" },
  "read-only": { type: "boolean" },
  type: { type: "string" },
  folder: { type: "string" },
  limit: { type: "string" },
  offset: { type: "string" },
  section: { type: "string" },
  "max-chars": { type: "string" },
  kind: { type: "string", multiple: true },
  date: { type: "string" },
  "no-time": { type: "boolean" },
  frontmatter: { type: "string" },
  body: { type: "string" },
  "dry-run": { type: "boolean" },
  help: { type: "boolean", short: "h" },
} as const;

export type CliValues = ReturnType<
  typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>
>["values"];

export interface ParsedCli {
  values: CliValues;
  command: string | undefined;
  rest: string[];
}

export function parseCli(argv: string[]): ParsedCli {
  const { values, positionals } = parseArgs({
    args: argv,
    options: OPTIONS,
    allowPositionals: true,
  });
  const [command, ...rest] = positionals;
  return { values, command, rest };
}
