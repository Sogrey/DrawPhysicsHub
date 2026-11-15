import type { ChallengeCheck, DemoChallenge, DemoStepBinding, ParamValues } from './types'

export type PedagogyContext = Record<string, number>

/**
 * Merge params + live observables into a flat numeric context for bindings / challenges.
 * 不写死任何 demo 公式；衍生量（如 v0x）须由 model.observe 写入 live。
 */
export function buildPedagogyContext(
  params: ParamValues,
  live: Record<string, number>,
): PedagogyContext {
  const ctx: PedagogyContext = { ...live }
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'number') ctx[k] = v
  }
  return ctx
}

export function formatBinding(binding: DemoStepBinding, ctx: PedagogyContext): string {
  const digits = binding.digits ?? 2
  const raw = ctx[binding.valueKey]
  const n = Number.isFinite(raw) ? (raw as number) : NaN
  const value = Number.isFinite(n) ? n.toFixed(digits) : '—'
  const unit = binding.unit ? `\\,\\mathrm{${binding.unit}}` : ''
  return `${binding.labelTex} = ${value}${unit}`
}

export function evalChallengeCheck(check: ChallengeCheck, ctx: PedagogyContext): boolean {
  switch (check.kind) {
    case 'paramNear':
    case 'valueNear': {
      const v = ctx[check.key]
      if (!Number.isFinite(v)) return false
      return Math.abs((v as number) - check.target) <= check.tol
    }
    case 'all':
      return check.checks.every((c) => evalChallengeCheck(c, ctx))
    default:
      return false
  }
}

export function challengeStatus(
  challenge: DemoChallenge,
  ctx: PedagogyContext,
): 'pending' | 'pass' {
  return evalChallengeCheck(challenge.check, ctx) ? 'pass' : 'pending'
}
