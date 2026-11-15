import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { ObserveSnapshot, ParamValues } from './types'

/** 对比轨迹（由 adapter 生成，Player 只持有状态） */
export interface CompareTrail {
  path: number[][]
  label?: string
}

export interface DemoAdapterContext {
  params: ParamValues
  live: Record<string, number>
  compare: CompareTrail | null
}

/**
 * Demo 渲染适配器：物理模型之外的画面与对比逻辑。
 * Player 只调协议，不 import 具体 demo。
 */
export interface DemoAdapter {
  paint2d?(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext): void
  setup3d?(host: ThreeHost): void
  paint3d?(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext): void
  dispose3d?(): void
  buildCompare?(snap: ObserveSnapshot, params: ParamValues): CompareTrail | null
  dispose?(): void
}

export type DemoAdapterFactory = () => DemoAdapter

const adapters = new Map<string, DemoAdapterFactory>()

export function registerAdapter(id: string, factory: DemoAdapterFactory): void {
  adapters.set(id, factory)
}

export function getAdapterFactory(id: string): DemoAdapterFactory | undefined {
  return adapters.get(id)
}

export function createAdapter(id: string): DemoAdapter | null {
  const f = adapters.get(id)
  return f ? f() : null
}
