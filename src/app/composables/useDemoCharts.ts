import { computed, ref, type Ref } from 'vue'
import type { DemoChartPanel, DemoMeta, ObserveSnapshot } from '@/core/physics/types'
import { resolveTMax } from '@/core/physics/types'
import {
  createEmptyMultiSeries,
  drawChartPanels,
  resampleOverTime,
  type MultiSeriesData,
} from '@/core/render/chart2d'

type SeekFn = (t: number) => void
type ObserveFn = () => ObserveSnapshot | null

/**
 * 曲线视图：主曲线 + 多参量面板纵向堆叠，共用对齐的时间横轴；
 * 随当前 t 同步揭示。
 */
export function useDemoCharts(
  meta: Ref<DemoMeta> | DemoMeta,
  opts: {
    seek: SeekFn
    observe: ObserveFn
    getCursorT: () => number
    syncLive?: () => void
  },
) {
  const chartEl = ref<HTMLCanvasElement | null>(null)
  let multiSeries: MultiSeriesData = createEmptyMultiSeries()
  let multiSeriesDirty = true

  function getMeta(): DemoMeta {
    return typeof meta === 'object' && meta !== null && 'value' in meta
      ? (meta as Ref<DemoMeta>).value
      : (meta as DemoMeta)
  }

  const chartView = computed(() => getMeta().views.find((v) => v.kind === 'chart'))

  const chartPanels = computed((): DemoChartPanel[] => {
    const m = getMeta()
    return chartView.value?.charts ?? m.charts ?? []
  })

  const chartKey = computed(() => chartView.value?.chartKey ?? 'y')

  const hasParamCharts = computed(
    () => (getMeta().features?.charts ?? false) && chartPanels.value.length > 0,
  )

  /** 纵向：主曲线在上，多参量面板依次在下 */
  const stackedPanels = computed((): DemoChartPanel[] => {
    const primary: DemoChartPanel = {
      id: 'primary',
      title: `${chartKey.value}(t)`,
      xLabel: 't (s)',
      leftLabel: chartKey.value,
      series: [
        {
          key: chartKey.value,
          label: chartKey.value,
          color: '#38bdf8',
          unit: chartKey.value === 'y' || chartKey.value === 'x' ? 'm' : undefined,
        },
      ],
    }
    if (!hasParamCharts.value) return [primary]
    return [primary, ...chartPanels.value]
  })

  const sampleKeys = computed(() => {
    const keys = new Set<string>()
    for (const panel of stackedPanels.value) {
      for (const s of panel.series) keys.add(s.key)
    }
    return [...keys]
  })

  function invalidate() {
    multiSeriesDirty = true
  }

  function ensureMultiSeries(tMax: number) {
    if (!multiSeriesDirty && multiSeries.t.length > 1) return
    const cursorT = opts.getCursorT()
    multiSeries = resampleOverTime(
      opts.seek,
      opts.observe,
      sampleKeys.value,
      tMax,
      128,
    )
    opts.seek(cursorT)
    opts.syncLive?.()
    multiSeriesDirty = false
  }

  function paint(snap: ObserveSnapshot) {
    if (!chartEl.value) return
    const nums: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') nums[k] = v
    }
    const tMax = resolveTMax(nums, getMeta())
    ensureMultiSeries(tMax)
    drawChartPanels(chartEl.value, multiSeries, stackedPanels.value, {
      cursorT: snap.time,
      revealUntil: snap.time,
    })
  }

  return {
    chartEl,
    hasParamCharts,
    chartPanels,
    invalidate,
    paint,
  }
}
