import type { SensitivePattern } from "../../config/schema.js";
import { passesLuhn } from "./luhn.js";

export interface Detector {
  name: string;
  regex: RegExp;
  accept?: (match: string) => boolean;
}

function detector(name: string, regex: RegExp, accept?: (match: string) => boolean): Detector {
  const global = regex.flags.includes("g") ? regex : new RegExp(regex.source, `${regex.flags}g`);
  return accept ? { name, regex: global, accept } : { name, regex: global };
}

const CARD_NUMBER = /\b[3-6]\d{3}([ -]?)\d{4}\1\d{4}\1\d{1,7}\b/;

export const BUILTIN_DETECTORS: readonly Detector[] = [
  detector("private key", /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/),
  detector("AWS access key", /\bAKIA[0-9A-Z]{16}\b/),
  detector("GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/),
  detector("API secret key", /\bsk-[A-Za-z0-9_-]{20,}\b/),
  detector("Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/),
  detector("US social security number", /\b\d{3}-\d{2}-\d{4}\b/),
  detector("Brazilian CPF", /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/),
  detector("payment card number", CARD_NUMBER, passesLuhn),
];

export function customDetector(pattern: SensitivePattern): Detector {
  return detector(pattern.name, new RegExp(pattern.pattern, pattern.flags));
}
