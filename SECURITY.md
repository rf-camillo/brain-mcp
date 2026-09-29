# Security policy

`brain-mcp` gives AI agents access to personal notes, so security reports are welcome and taken seriously.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's [private vulnerability reporting](https://github.com/rf-camillo/brain-mcp/security/advisories/new) and include:

- what an agent or a note can do that it should not, such as reading a blocked path, writing outside `writable` or bypassing the secret scan;
- the smallest vault and `brain.config.yaml` that reproduce it;
- the version or commit you tested.

You should get an answer within a few days.

## Scope

In scope: anything that breaks the guarantees in the README's security model.

Out of scope: attacks that require control of the machine running the server, and detection of secrets that do not match any built-in or configured pattern. The secret scan is a safety net, not a data loss prevention system.
