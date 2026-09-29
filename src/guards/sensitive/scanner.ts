import type { SensitivePattern } from "../../config/schema.js";
import { BUILTIN_DETECTORS, customDetector, type Detector } from "./detectors.js";

export interface SensitiveMatch {
  name: string;
  line: number;
}

export interface SensitiveScannerOptions {
  builtin: boolean;
  patterns: readonly SensitivePattern[];
}

function detects(detector: Detector, line: string): boolean {
  for (const match of line.matchAll(detector.regex)) {
    if (!detector.accept || detector.accept(match[0])) return true;
  }
  return false;
}

export class SensitiveScanner {
  private readonly detectors: readonly Detector[];

  constructor(options: SensitiveScannerOptions) {
    this.detectors = [
      ...(options.builtin ? BUILTIN_DETECTORS : []),
      ...options.patterns.map(customDetector),
    ];
  }

  scan(text: string): SensitiveMatch[] {
    return text
      .split("\n")
      .flatMap((line, index) =>
        this.detectors
          .filter((detector) => detects(detector, line))
          .map((detector) => ({ name: detector.name, line: index + 1 })),
      );
  }
}
