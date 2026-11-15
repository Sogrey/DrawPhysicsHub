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
