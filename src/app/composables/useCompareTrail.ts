import { computed, ref, type Ref } from 'vue'
import type { CompareTrail } from '@/core/physics/adapter'
import type { DemoLegendItem } from '@/core/physics/types'

/**
 * 对比轨迹状态 + 图例过滤。
 * 路径内容由 adapter.buildCompare 生成；无对比时按 id（优先）或 label 隐藏图例项。
 */
export function useCompareTrail(
  legend: Ref<DemoLegendItem[] | undefined> | (() => DemoLegendItem[] | undefined),
  opts?: { compareLegendId?: string; compareLegendLabel?: string },
) {
  const compare = ref<CompareTrail | null>(null)
  const compareLegendId = opts?.compareLegendId ?? 'compare'
  const compareLegendLabel = opts?.compareLegendLabel ?? '对比轨迹'

  function getLegendBase(): DemoLegendItem[] {
    if (typeof legend === 'function') return legend() ?? []
    return legend.value ?? []
  }

  const displayLegend = computed(() => {
    const base = getLegendBase()
    if (compare.value) return base
    return base.filter((item) => {
      if (item.id) return item.id !== compareLegendId
      return item.label !== compareLegendLabel
    })
  })

  function setCompare(trail: CompareTrail | null) {
    compare.value = trail
  }

  function clearCompare() {
    compare.value = null
  }

  return {
    compare,
    displayLegend,
    setCompare,
    clearCompare,
    hasCompare: computed(() => !!compare.value),
  }
}
