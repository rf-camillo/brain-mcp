import { createVault, note } from "./helpers.js";

export async function teamVault(): Promise<string> {
  return createVault({
    "brain.config.yaml": "blocked:\n  - private/**\n",
    "index.md": note({ type: "index", summary: "Catalog of the vault" }, "# Index"),
    "projects/Launch Plan.md": note(
      { type: "project", summary: "Plan for the public launch in March" },
      [
        "# Launch Plan",
        "",
        "Owner: [[Ana]]. See [[Pricing#Tiers|pricing tiers]] and [[Missing Note]].",
        "",
        "## Risks",
        "",
        "Payment provider approval may slip.",
        "",
        "### Mitigation",
        "",
        "Apply early.",
        "",
        "## Timeline",
        "",
        "March.",
      ].join("\n"),
    ),
    "projects/Pricing.md": note(
      { type: "project", summary: "Pricing tiers and discounts" },
      "# Pricing\n\n## Tiers\n\nFree and Pro.\n\n[[Launch Plan]]",
    ),
    "people/Ana.md": note(
      { type: "person", summary: "Product lead, owns the launch" },
      "# Ana\n\nLeads the [[Launch Plan]]. Prefers written updates.",
    ),
    "wiki/Café Notes.md": note(
      { type: "concept", summary: "Notes from coffee chats" },
      "# Café Notes\n\nThe launch came up again over coffee.",
    ),
    "private/Salaries.md": note(
      { type: "private", summary: "Launch bonuses" },
      "# Salaries\n\n[[Launch Plan]] bonus.",
    ),
    "templates/Daily.md": "# Launch template",
  });
}
