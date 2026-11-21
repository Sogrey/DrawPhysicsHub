<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { DemoMeta } from '@/core/physics/types'
import { resolveTMax } from '@/core/physics/types'
import { createAdapter, type DemoAdapter } from '@/core/physics/adapter'
import { useDemoModel } from '@/app/composables/useDemoModel'
import { useSimPlayback } from '@/app/composables/useSimPlayback'
import { usePedagogy } from '@/app/composables/usePedagogy'
import { useCanvas2DView } from '@/app/composables/useCanvas2DView'
import { useThreeView } from '@/app/composables/useThreeView'
import { useCompareTrail } from '@/app/composables/useCompareTrail'
import { useDemoCharts } from '@/app/composables/useDemoCharts'
import { useFpsHud } from '@/app/composables/useFpsHud'
import { t } from '@/app/i18n'
import ParamConsole from './demo/ParamConsole.vue'
import PlaybackBar from './demo/PlaybackBar.vue'
import ReadoutGrid from './demo/ReadoutGrid.vue'
import ChallengeList from './demo/ChallengeList.vue'
import AnalysisPanel from './demo/AnalysisPanel.vue'
import HudLegend from './demo/HudLegend.vue'
import ViewTabs from './demo/ViewTabs.vue'
import DemoConsoleHeader from './demo/DemoConsoleHeader.vue'
import DocsView from './demo/DocsView.vue'
import ThreeViewHud from './demo/ThreeViewHud.vue'

const props = defineProps<{ meta: DemoMeta }>()

const playerEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const activeView = ref(props.meta.views[0]?.id ?? 'main2d')
const showAnalysis = ref(true)
const live = reactive<Record<string, number>>({})
const { showFps, fps, tick: tickFps, toggle: toggleFps } = useFpsHud()

const modelApi = useDemoModel(props.meta)
const { params } = modelApi

const {
  hasAnalysis,
  challengeCards,
  conceptParagraphs,
  bindingTex,
  toggleHint,
} = usePedagogy(props.meta, params, live)

const {
  canvasEl: canvas2dEl,
  setup: setupCanvas2d,
  resize: resizeCanvas2d,
  dispose: disposeCanvas2d,
  getHost: getCanvas2dHost,
} = useCanvas2DView()

const {
  canvasEl: threeEl,
  autoRotate,
  setup: setupThreeHost,
  resize: resizeThree,
  toggleAutoRotate,
  resetView: resetThreeView,
  applyPreset: applyThreePreset,
  dispose: disposeThree,
  getHost: getThreeHost,
} = useThreeView()

const {
  compare,
  displayLegend,
  setCompare,
  clearCompare: clearCompareState,
  hasCompare,
} = useCompareTrail(() => props.meta.docs.legend, {
  compareLegendId: props.meta.features?.compareLegendId ?? 'compare',
})

const {
  chartEl,
  invalidate: invalidateCharts,
  paint: paintCharts,
} = useDemoCharts(props.meta, {
  seek: (t) => modelApi.seek(t),
  observe: () => modelApi.observe(),
  getCursorT: () => live.t ?? 0,
  syncLive: () => {
    syncLiveFromSnap()
  },
})

let adapter: DemoAdapter | null = null

const features = computed(() => props.meta.features ?? {})
const viewById = computed(() => new Map(props.meta.views.map((v) => [v.id, v])))
const activeKind = computed(() => viewById.value.get(activeView.value)?.kind)

const view2dId = computed(() => props.meta.views.find((v) => v.kind === 'canvas2d')?.id)
const view3dId = computed(() => props.meta.views.find((v) => v.kind === 'three')?.id)
const viewChartId = computed(() => props.meta.views.find((v) => v.kind === 'chart')?.id)
const viewDocsId = computed(() => props.meta.views.find((v) => v.kind === 'docs')?.id)

const playback = useSimPlayback({
  step: (dt) => modelApi.step(dt),
  paint: () => {
    tickFps()
    paint()
  },
  isDone: () => Number(modelApi.observe()?.values.done ?? 0) === 1,
  reset: () => {
    modelApi.reset()
    invalidateCharts()
  },
  loopRestart: () => {
    modelApi.reset()
  },
})
const { playing, speed, scrubbing, loop, play, pause, stopLoop } = playback

let fpsRaf = 0
function fpsIdleLoop() {
  tickFps()
  if (showFps.value && !playing.value) fpsRaf = requestAnimationFrame(fpsIdleLoop)
  else fpsRaf = 0
}
watch(showFps, (on) => {
  if (on && !playing.value && !fpsRaf) fpsRaf = requestAnimationFrame(fpsIdleLoop)
  if (!on && fpsRaf) {
    cancelAnimationFrame(fpsRaf)
    fpsRaf = 0
  }
})

const readouts = computed(() =>
  (props.meta.readouts ?? []).map((d) => {
    const n = Number(live[d.key] ?? 0)
    const digits = d.digits ?? 2
    const unit = d.unit ? ` ${d.unit}` : ''
    return {
      key: d.key,
      label: d.label,
      value: `${n.toFixed(digits)}${unit}`,
      tone: d.tone,
    }
  }),
)

const tMax = computed(() => resolveTMax(live, props.meta))
const canScrub = computed(() => (features.value.scrub ?? false) && tMax.value > 0)
const showCompare = computed(() => features.value.compare ?? false)

function adapterCtx() {
  return {
    params: { ...params },
    live,
    compare: compare.value,
  }
}

function syncLiveFromSnap() {
  const snap = modelApi.observe()
  if (!snap) return snap
  live.t = snap.time
  for (const [k, v] of Object.entries(snap.values)) {
    if (typeof v === 'number') live[k] = v
  }
  return snap
}

function paint() {
  const snap = syncLiveFromSnap()
  if (!snap) return

  const kind = activeKind.value
  if (kind === 'canvas2d') {
    const host = getCanvas2dHost()
    if (host) adapter?.paint2d?.(host, snap, adapterCtx())
  }
  if (kind === 'three') {
    const host = getThreeHost()
    if (host) adapter?.paint3d?.(host, snap, adapterCtx())
  }
  if (kind === 'chart') paintCharts(snap)
}

function onParamChange() {
  modelApi.setParamsFromUi()
  scrubbing.value = false
  invalidateCharts()
  paint()
}

function reset() {
  pause()
  scrubbing.value = false
  modelApi.reset()
  invalidateCharts()
  paint()
}

function onScrub(e: Event) {
  pause()
  scrubbing.value = true
  modelApi.seek(Number((e.target as HTMLInputElement).value))
  paint()
}

function keepCompare() {
  const snap = modelApi.observe()
  if (!snap || !adapter?.buildCompare) return
  setCompare(adapter.buildCompare(snap, { ...params }))
  paint()
}

function clearCompare() {
  clearCompareState()
  paint()
}

function setSpeed(v: number) {
  speed.value = v
}

function setLoop(v: boolean) {
  loop.value = v
}

function setupActiveView(id: string) {
  const kind = viewById.value.get(id)?.kind
  if (kind === 'canvas2d') setupCanvas2d()
  if (kind === 'three') {
    adapter?.dispose3d?.()
    const host = setupThreeHost()
    if (host) adapter?.setup3d?.(host)
  }
}

function onResize() {
  resizeCanvas2d()
  resizeThree()
  paint()
}

function onFullscreenChange() {
  const el = playerEl.value
  isFullscreen.value = !!el && document.fullscreenElement === el
  // 全屏切换后布局变化，补一次 resize
  requestAnimationFrame(() => onResize())
}

async function toggleFullscreen() {
  const el = playerEl.value
  if (!el) return
  try {
    if (document.fullscreenElement === el) await document.exitFullscreen()
    else await el.requestFullscreen()
  } catch (e) {
    console.warn('fullscreen failed', e)
  }
}

watch(activeView, async (id) => {
  await Promise.resolve()
  setupActiveView(id)
  paint()
})

onMounted(() => {
  try {
    const adapterId = props.meta.adapter ?? props.meta.model
    adapter = createAdapter(adapterId)
    if (!adapter) throw new Error(`未注册适配器: ${adapterId}`)
    modelApi.defaultsFromMeta()
    modelApi.ensureModel()
    setupActiveView(activeView.value)
    paint()
  } catch (e) {
    disposeCanvas2d()
    disposeThree()
    modelApi.dispose()
    adapter = null
    throw e instanceof Error ? e : new Error(String(e))
  }
  window.addEventListener('resize', onResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  stopLoop()
  if (fpsRaf) cancelAnimationFrame(fpsRaf)
  if (document.fullscreenElement && playerEl.value && document.fullscreenElement === playerEl.value) {
    void document.exitFullscreen()
  }
  adapter?.dispose3d?.()
  adapter?.dispose?.()
  adapter = null
  disposeCanvas2d()
  disposeThree()
  modelApi.dispose()
  window.removeEventListener('resize', onResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div
    ref="playerEl"
    class="player"
    :class="{
      'with-analysis': showAnalysis && hasAnalysis,
      'is-fullscreen': isFullscreen,
    }"
  >
    <aside class="side console">
      <DemoConsoleHeader
        :subject="meta.subject"
        :category="meta.category"
        :title="meta.docs.title"
        :summary="meta.docs.summary"
      />

      <section class="panel">
        <header class="panel-h">动态控制台</header>
        <ParamConsole :params-def="meta.params" :params="params" @change="onParamChange" />
        <PlaybackBar
          :playing="playing"
          :speed="speed"
          :loop="loop"
          :can-scrub="canScrub"
          :t="live.t ?? 0"
          :t-max="tMax"
          :show-compare="showCompare"
          :has-compare="hasCompare"
          @play="play"
          @pause="pause"
          @reset="reset"
          @update:speed="setSpeed"
          @update:loop="setLoop"
          @scrub="onScrub"
          @keep-compare="keepCompare"
          @clear-compare="clearCompare"
        />
      </section>

      <ReadoutGrid :items="readouts" :insight="meta.docs.insight" />
      <ChallengeList :items="challengeCards" @toggle-hint="toggleHint" />

      <button
        v-if="hasAnalysis"
        type="button"
        class="analysis-toggle"
        @click="showAnalysis = !showAnalysis"
      >
        {{ showAnalysis ? '收起详细解析' : '展开详细解析' }}
      </button>
    </aside>

    <AnalysisPanel
      v-if="showAnalysis && hasAnalysis"
      :steps="meta.docs.steps"
      :objectives="meta.docs.objectives"
      :scrubbing="scrubbing"
      :binding-tex="bindingTex"
    />

    <section class="stage">
      <ViewTabs v-model="activeView" :views="meta.views">
        <template #actions>
          <button
            type="button"
            class="stage-btn"
            :title="showFps ? t('player.fpsOff') : t('player.fpsOn')"
            :class="{ active: showFps }"
            @click="toggleFps"
          >
            {{ t('player.fps') }}
          </button>
          <button
            type="button"
            class="stage-btn"
            :title="isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen')"
            @click="toggleFullscreen"
          >
            {{ isFullscreen ? t('player.exitFullscreen') : t('player.fullscreen') }}
          </button>
        </template>
      </ViewTabs>

      <div v-if="view2dId" class="viewport dark" v-show="activeView === view2dId">
        <canvas ref="canvas2dEl"></canvas>
        <HudLegend :items="displayLegend" />
      </div>

      <div v-if="view3dId" class="viewport dark" v-show="activeView === view3dId">
        <canvas ref="threeEl"></canvas>
        <ThreeViewHud
          :auto-rotate="autoRotate"
          :presets="meta.features?.cameraPresets"
          :hint="
            meta.features?.cameraPresets?.length
              ? '偏振取景：点预设 · 拖拽旋转 · 右键平移 · 滚轮缩放'
              : undefined
          "
          @reset-view="resetThreeView"
          @toggle-auto-rotate="toggleAutoRotate"
          @apply-preset="applyThreePreset"
        />
      </div>

      <div v-if="viewChartId" class="viewport dark" v-show="activeView === viewChartId">
        <canvas ref="chartEl"></canvas>
      </div>

      <DocsView
        v-if="viewDocsId"
        v-show="activeView === viewDocsId"
        :concept-paragraphs="conceptParagraphs"
        :objectives="meta.docs.objectives"
        :formulas="meta.docs.formulas"
      />

      <div v-if="showFps" class="fps-hud">{{ t('player.fps') }} {{ fps }}</div>
    </section>
  </div>
</template>
