import { registerAdapter, type DemoAdapterFactory } from './adapter'
import type { DemoMeta, PhysicsModelFactory } from './types'

const models = new Map<string, PhysicsModelFactory>()
const demos = new Map<string, DemoMeta>()

export function registerModel(id: string, factory: PhysicsModelFactory): void {
  models.set(id, factory)
}

export function getModelFactory(id: string): PhysicsModelFactory {
  const f = models.get(id)
  if (!f) throw new Error(`未注册物理模型: ${id}`)
  return f
}

export function registerDemo(meta: DemoMeta): void {
  demos.set(meta.id, meta)
}

export function getDemo(id: string): DemoMeta | undefined {
  return demos.get(id)
}

export function listDemos(): DemoMeta[] {
  return [...demos.values()]
}

export function listDemosBySubject(subject: string): DemoMeta[] {
  return listDemos().filter((d) => d.subject === subject)
}

/** 一次注册 model + adapter + meta，减少漏注册 */
export function registerDemoBundle(opts: {
  meta: DemoMeta
  model: PhysicsModelFactory
  adapter?: DemoAdapterFactory
  /** 缺省用 meta.adapter ?? meta.model */
  adapterId?: string
  modelId?: string
}): void {
  const modelId = opts.modelId ?? opts.meta.model
  registerModel(modelId, opts.model)
  if (opts.adapter) {
    const adapterId = opts.adapterId ?? opts.meta.adapter ?? opts.meta.model
    registerAdapter(adapterId, opts.adapter)
  }
  registerDemo(opts.meta)
}
