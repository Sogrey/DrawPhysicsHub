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

/** 图表中一条曲线；同 panel 内可左右轴混排 */
export interface DemoChartSeriesDef {
  key: string
  label: string
  color: string
  /** 缺省 left */
  axis?: 'left' | 'right'
  unit?: string
}

/** 一个图表面板：共用横轴（默认仿真时间 t） */
export interface DemoChartPanel {
  id: string
  title: string
  xLabel?: string
  leftLabel?: string
  rightLabel?: string
  series: DemoChartSeriesDef[]
}

export interface DemoView {
  id: string
  kind: ViewKind
  title: string
  /** Template or custom renderer id / adapter 视图钩子 */
  renderer?: string
  /** kind=chart 时最上方面板主曲线的 observe key */
  chartKey?: string
  /** kind=chart 时其下纵向堆叠的多面板（features.charts 开启） */
  charts?: DemoChartPanel[]
}

/** 3D 相机预设（偏振等演示引导取景） */
export interface CameraViewPreset {
  id: string
  label: string
  lookAt?: [number, number, number]
  yaw?: number
  pitch?: number
  distance?: number
}

/** 控制台能力开关；缺省均视为关闭，demo 显式打开 */
export interface DemoFeatures {
  compare?: boolean
  scrub?: boolean
  /** 多参量曲线面板（与主曲线纵向堆叠，横轴对齐） */
  charts?: boolean
  /** 无对比时从图例隐藏的项 id（缺省 'compare'） */
  compareLegendId?: string
  /** 3D 视口相机引导预设（M5-15） */
  cameraPresets?: CameraViewPreset[]
}

/** 时间轴 / 曲线全长键约定 */
export interface DemoTimeConfig {
  /**
   * observe.values 中 scrub 上限与曲线采样终点键。
   * 缺省 `tMax`；解析时仍兼容旧键 `flightTime`。
   */
  maxKey?: string
}

export interface DemoLegendItem {
  color: string
  label: string
  /** 稳定 id（如 compare）；过滤时优先于 label */
  id?: string
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

/** 左侧实时读数行定义（由 observe.values[key] 填充） */
export interface DemoReadoutDef {
  key: string
  label: string
  unit?: string
  tone?: 'cyan' | 'green' | 'blue' | 'purple' | 'amber' | 'slate' | 'pink'
  digits?: number
}

export interface DemoMeta {
  id: string
  subject: string
  category: string
  tags?: string[]
  params: ParamDef[]
  views: DemoView[]
  docs: DemoDocs
  /** 实时读数声明；缺省时由播放器按常见 key 兜底 */
  readouts?: DemoReadoutDef[]
  /**
   * 全局图表面板（也可写在 views[].charts）。
   * 横轴一般为时间 t：参量走完一个完整过程时采样生成各实时量曲线。
   */
  charts?: DemoChartPanel[]
  /** 控制台 / 视口能力开关 */
  features?: DemoFeatures
  /** 时间轴键配置 */
  time?: DemoTimeConfig
  /** Factory id registered in demo registry */
  model: string
  /**
   * 渲染适配器 id（registerAdapter）。
   * 缺省与 model 同名；无 adapter 时仅支持 chart/docs。
   */
  adapter?: string
}

/** 解析 scrub / 曲线全长（秒） */
export function resolveTMax(
  values: Record<string, number>,
  meta?: Pick<DemoMeta, 'time'> | null,
): number {
  const key = meta?.time?.maxKey ?? 'tMax'
  const raw = values[key] ?? values.tMax ?? values.flightTime ?? 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
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
