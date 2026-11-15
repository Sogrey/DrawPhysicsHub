import { reactive, type Ref } from 'vue'
import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { getModelFactory } from '@/core/physics/registry'

export function useDemoModel(meta: Ref<DemoMeta> | DemoMeta) {
  const params = reactive<ParamValues>({})
  let model: PhysicsModel | null = null

  function getMeta() {
    return typeof meta === 'object' && 'value' in meta ? meta.value : meta
  }

  function defaultsFromMeta() {
    const m = getMeta()
    for (const p of m.params) {
      params[p.key] = p.default
    }
  }

  function ensureModel() {
    const m = getMeta()
    if (!model) model = getModelFactory(m.model)()
    model.init({ ...params })
    return model
  }

  function getModel() {
    return model
  }

  function observe(): ObserveSnapshot | null {
    return model?.observe() ?? null
  }

  function setParamsFromUi() {
    ensureModel()
    model?.setParams?.({ ...params })
  }

  function seek(t: number) {
    ensureModel()
    if (model?.seek) {
      model.seek(t)
      return
    }
    model!.init({ ...params })
    let acc = 0
    while (acc < t - 1e-9) {
      model!.step(0.01)
      acc += 0.01
      if (Number(model!.observe().values.done ?? 0) === 1) break
    }
  }

  function step(dt: number) {
    model?.step(dt)
  }

  function reset() {
    ensureModel()
  }

  function dispose() {
    model?.dispose?.()
    model = null
  }

  return {
    params,
    defaultsFromMeta,
    ensureModel,
    getModel,
    observe,
    setParamsFromUi,
    seek,
    step,
    reset,
    dispose,
  }
}
