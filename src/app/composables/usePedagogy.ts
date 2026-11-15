import { computed, reactive, type Ref } from 'vue'
import type { DemoDocs, DemoMeta, ParamValues } from '@/core/physics/types'
import {
  buildPedagogyContext,
  challengeStatus,
  formatBinding,
} from '@/core/physics/pedagogy'

export function usePedagogy(
  meta: Ref<DemoMeta> | DemoMeta,
  params: ParamValues,
  live: Record<string, number>,
) {
  const revealedHints = reactive<Record<string, boolean>>({})

  function getMeta() {
    return typeof meta === 'object' && 'value' in meta ? meta.value : meta
  }

  const pedagogyCtx = computed(() => buildPedagogyContext(params, { ...live }))

  const conceptParagraphs = computed(() => {
    const c = getMeta().docs.concept
    if (!c) return [] as string[]
    return Array.isArray(c) ? c : [c]
  })

  const hasSteps = computed(() => (getMeta().docs.steps?.length ?? 0) > 0)
  const hasChallenges = computed(() => (getMeta().docs.challenges?.length ?? 0) > 0)
  /** 中间栏只放详细解析 / 教学目标；概念解释仅在「说明」页 */
  const hasAnalysis = computed(
    () => hasSteps.value || (getMeta().docs.objectives?.length ?? 0) > 0,
  )

  const challengeCards = computed(() => {
    const list = getMeta().docs.challenges ?? []
    return list.map((c) => ({
      ...c,
      status: challengeStatus(c, pedagogyCtx.value),
      hintOpen: !!revealedHints[c.id],
    }))
  })

  function toggleHint(id: string) {
    revealedHints[id] = !revealedHints[id]
  }

  function bindingTex(labelTex: string, valueKey: string, unit?: string, digits?: number) {
    return formatBinding({ labelTex, valueKey, unit, digits }, pedagogyCtx.value)
  }

  function docs(): DemoDocs {
    return getMeta().docs
  }

  return {
    revealedHints,
    pedagogyCtx,
    conceptParagraphs,
    hasSteps,
    hasChallenges,
    hasAnalysis,
    challengeCards,
    toggleHint,
    bindingTex,
    docs,
  }
}
