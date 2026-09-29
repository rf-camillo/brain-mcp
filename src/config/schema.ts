import { z } from "zod";

const globList = z.array(z.string().min(1));

const sensitivePatternSchema = z.object({
  name: z.string().min(1),
  pattern: z.string().min(1),
  flags: z
    .string()
    .regex(/^[imsu]*$/)
    .default(""),
});

export const configSchema = z
  .object({
    frontmatter: z
      .object({ required: z.array(z.string().min(1)).default(["summary", "type"]) })
      .prefault({}),
    blocked: globList.default([]),
    ignored: globList.default(["templates/**"]),
    writable: globList.default(["diary/**", "inbox/**"]),
    index: z.object({ path: z.string().min(1).default("index.md") }).prefault({}),
    diary: z
      .object({
        path: z.string().min(1).default("diary/{yyyy}/{yyyy}-{mm}-{dd}.md"),
        template: z.string().min(1).nullable().default(null),
        sections: z.array(z.string().min(1)).default([]),
      })
      .prefault({}),
    sensitive: z
      .object({
        builtin: z.boolean().default(true),
        patterns: z.array(sensitivePatternSchema).default([]),
      })
      .prefault({}),
  })
  .strict();

/** The validated contents of `brain.config.yaml`, with defaults applied. */
export type VaultConfig = z.output<typeof configSchema>;
export type SensitivePattern = z.output<typeof sensitivePatternSchema>;
