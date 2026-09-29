# Example vault

`vault/` is the shared memory of Tidewater Labs, a fictional two-person startup building Harbor, a booking app for small studios. Every name and number in it is made up.

It shows the conventions `brain-mcp` is built for: a `summary` and `type` on every note, a generated `index.md`, a daily note with sections, an `inbox/` for new notes, an `AGENTS.md` for agents and a `private/` folder that `brain.config.yaml` blocks.

Try it from the repository root after `npm run build`:

```sh
node dist/bin/cli.js --vault examples/vault index
node dist/bin/cli.js --vault examples/vault read "Launch Plan" --section Risks
node dist/bin/cli.js --vault examples/vault read private/Compensation.md   # NOT_FOUND
```

Or connect Claude Code to a copy of it:

```sh
cp -r examples/vault /tmp/tidewater
claude mcp add tidewater -- node "$PWD/dist/bin/mcp.js" /tmp/tidewater
```
