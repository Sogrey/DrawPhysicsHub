/** Vector / lerp helpers (M1-06) */

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

export function add2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]]
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]]
}

export function scale2(a: Vec2, s: number): Vec2 {
  return [a[0] * s, a[1] * s]
}

export function length2(a: Vec2): number {
  return Math.hypot(a[0], a[1])
}

export function normalize2(a: Vec2): Vec2 {
  const L = length2(a)
  if (L === 0) return [0, 0]
  return [a[0] / L, a[1] / L]
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

export function add3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

export function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}
