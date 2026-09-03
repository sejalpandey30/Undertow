// Mulberry32 — small, fast, deterministic PRNG so a given seed always
// produces the same batch. This matters for an audit trail: a run needs
// to be reproducible, not just plausible.
export function makeRng(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function weightedPick<T>(rng: () => number, entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [val, w] of entries) {
    if (r < w) return val
    r -= w
  }
  return entries[entries.length - 1][0]
}

export function range(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min)
}

export function intRange(rng: () => number, min: number, max: number) {
  return Math.floor(range(rng, min, max + 1))
}
