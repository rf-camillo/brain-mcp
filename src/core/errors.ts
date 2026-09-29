export type VaultErrorCode =
  | "INVALID_CONFIG"
  | "INVALID_PATH"
  | "OUTSIDE_VAULT"
  | "NOT_FOUND"
  | "AMBIGUOUS"
  | "NOT_WRITABLE"
  | "READ_ONLY"
  | "ALREADY_EXISTS"
  | "SENSITIVE_CONTENT"
  | "INVALID_FRONTMATTER"
  | "INVALID_INPUT";

/**
 * An expected failure with a stable {@link VaultErrorCode}, safe to show to an agent.
 */
export class VaultError extends Error {
  readonly code: VaultErrorCode;

  constructor(code: VaultErrorCode, message: string) {
    super(message);
    this.name = "VaultError";
    this.code = code;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
