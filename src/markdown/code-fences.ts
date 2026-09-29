const FENCE = /^\s*(```|~~~)/;

export function* linesOutsideCode(body: string): Generator<[index: number, line: string]> {
  let open: string | null = null;
  for (const [index, line] of body.split("\n").entries()) {
    const marker = FENCE.exec(line)?.[1];
    if (marker !== undefined) {
      if (open === null) open = marker;
      else if (open === marker) open = null;
      continue;
    }
    if (open === null) yield [index, line];
  }
}
