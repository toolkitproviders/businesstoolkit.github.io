/**
 * Randomness for the generator tools.
 *
 * Kept in one place so every tool that shuffles, picks or generates uses the
 * platform's cryptographic source rather than Math.random, and so the modulo
 * bias is dealt with once instead of in each tool.
 */

/** Uniform random integer in [0, max). */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Reject the tail of the range so the modulo does not favour low values.
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let value = limit;
    while (value >= limit) {
      crypto.getRandomValues(buf);
      value = buf[0];
    }
    return value % max;
  }
  return Math.floor(Math.random() * max);
}

/** Fisher-Yates, in place, using the same source. */
export function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
