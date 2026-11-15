/** Demo / physics protocol (M1-03 ~ M1-05 + pedagogy) */

export type ParamKind = 'number' | 'boolean' | 'select' | 'vec2' | 'vec3'

export interface ParamBase {
  key: string
  label: string
  kind: ParamKind
  unit?: string
  description?: string
}

export interface NumberParam extends ParamBase {
  kind: 'number'
  default: number
  min?: number
  max?: number
  step?: number
}

export interface BooleanParam extends ParamBase {
  kind: 'boolean'
  default: boolean
}

export interface SelectParam extends ParamBase {
  kind: 'select'
  default: string
  options: { value: string; label: string }[]
}

export interface VecParam extends ParamBase {
  kind: 'vec2' | 'vec3'
  default: number[]
  min?: number
  max?: number
  step?: number
}

export type ParamDef = NumberParam | BooleanParam | SelectParam | VecParam

export type ParamValues = Record<string, number | boolean | string | number[]>

export type ViewKind = 'canvas2d' | 'three' | 'chart' | 'docs'

export interface DemoView {
  id: string
  kind: ViewKind
  title: string
  /** Template or custom renderer id */
  renderer?: string
}

export interface DemoLegendItem {
  color: string
  label: string
}

/** Live numeric substitution under a symbolic formula */
export interface DemoStepBinding {
  /** KaTeX symbol, e.g. v_{0x} */
  labelTex: string
  /** Key into pedagogy context (params + observe-derived) */
  valueKey: string
  unit?: string
  digits?: number
}

export interface DemoAnalysisStep {
  id?: string
  title: string
  body?: string
  /** KaTeX formulas shown under this step */
  formulas?: string[]
  /** 符号式旁的实时代入读数 */
  bindings?: DemoStepBinding[]
  /** 拖动时间轴时高亮该步 */
  highlightOn?: 'scrub'
}

export type ChallengeCheck =
  | { kind: 'paramNear'; key: string; target: number; tol: number }
  | { kind: 'valueNear'; key: string; target: number; tol: number }
  | { kind: 'all'; checks: ChallengeCheck[] }

export interface DemoChallenge {
  id: string
  prompt: string
  hint: string
  check: ChallengeCheck
}

export interface DemoDocs {
  title: string
  summary: string
  /** 概念解释（中栏顶部，可多段） */
  concept?: string | string[]
  objectives?: string[]
  /** KaTeX-capable markdown-ish lines */
  formulas?: string[]
  /** 详细解析步骤（侧栏 / 中栏） */
  steps?: DemoAnalysisStep[]
  /** 视口图例 */
  legend?: DemoLegendItem[]
  /** 底部提示条 */
  insight?: string
  /** 引导挑战（先藏答案） */
  challenges?: DemoChallenge[]
}

export interface DemoMeta {
  id: string
  subject: string
  category: string
  tags?: string[]
  params: ParamDef[]
  views: DemoView[]
  docs: DemoDocs
  /** Factory id registered in demo registry */
  model: string
}

export interface ObserveSnapshot {
  time: number
  /** Named scalar / vector observables for renderers */
  values: Record<string, number | number[] | Float32Array>
  /** Optional trail points [[x,y], ...] or [[x,y,z], ...] */
  trails?: Record<string, number[][]>
  labels?: Record<string, string>
}

export interface PhysicsModel {
  init(params: ParamValues): void
  step(dt: number): void
  observe(): ObserveSnapshot
  reset(): void
  /** Optional: hot-update parameters without full reset */
  setParams?(params: Partial<ParamValues>): void
  /** Optional: jump to absolute simulation time (rebuild trails) */
  seek?(t: number): void
  dispose?(): void
}

export type PhysicsModelFactory = () => PhysicsModel
