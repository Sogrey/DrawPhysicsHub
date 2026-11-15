<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { getModelFactory } from '@/core/physics/registry'
import {
  buildPedagogyContext,
  challengeStatus,
  formatBinding,
} from '@/core/physics/pedagogy'
import {
  createCanvas2DHost,
  drawProjectileFrame,
  VELOCITY_ARROW_SCALE,
  type Canvas2DHost,
} from '@/core/render/canvas2d'
import { createThreeHost, syncProjectileThree, type ThreeHost } from '@/core/render/threeHost'
import {
  createEmptySeries,
  drawLineChart,
  pushSample,
  type ChartSeries,
} from '@/core/render/chart2d'
import KatexFormula from './KatexFormula.vue'

const props = defineProps<{ meta: DemoMeta }>()

const activeView = ref(props.meta.views[0]?.id ?? 'main2d')
const playing = ref(false)
const speed = ref(1)
const showAnalysis = ref(true)
const autoRotate = ref(false)
const scrubbing = ref(false)
const revealedHints = reactive<Record<string, boolean>>({})
const compareTrail = ref<{ path: number[][]; label: string } | null>(null)

/** 图例浮层位置 */
const legendPos = reactive({ x: null as number | null, y: 12 })
const legendDragging = ref(false)
const params = reactive<ParamValues>({})
const live = reactive({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  speed: 0,
  t: 0,
  hmax: 0,
  range: 0,
  tmax: 0,
  flightTime: 0,
})

let model: PhysicsModel | null = null
let raf = 0
let lastTs = 0
let canvasHost: Canvas2DHost | null = null
let threeHost: ThreeHost | null = null
let ball: THREE.Mesh | null = null
let trailLine: THREE.Line | null = null
let ghostLine: THREE.Line | null = null
let series: ChartSeries = createEmptySeries()

const canvas2dEl = ref<HTMLCanvasElement | null>(null)
const threeEl = ref<HTMLCanvasElement | null>(null)
const chartEl = ref<HTMLCanvasElement | null>(null)
const legendEl = ref<HTMLElement | null>(null)

let legendDragOffsetX = 0
let legendDragOffsetY = 0
let legendHostEl: HTMLElement | null = null

const legendStyle = computed(() => {
  if (legendPos.x === null) {
    return { top: `${legendPos.y}px`, right: '12px', left: 'auto' }
  }
  return { top: `${legendPos.y}px`, left: `${legendPos.x}px`, right: 'auto' }
})

const pedagogyCtx = computed(() => buildPedagogyContext(params, { ...live }))

const readouts = computed(() => [
  { key: 't', label: 't', value: `${live.t.toFixed(2)} s`, tone: 'cyan' },
  { key: 'x', label: 'x', value: `${live.x.toFixed(2)} m`, tone: 'slate' },
  { key: 'y', label: 'y', value: `${live.y.toFixed(2)} m`, tone: 'slate' },
  { key: 'v', label: '|v|', value: `${live.speed.toFixed(2)} m/s`, tone: 'green' },
  { key: 'vx', label: 'vₓ', value: `${live.vx.toFixed(2)} m/s`, tone: 'blue' },
  { key: 'vy', label: 'vᵧ', value: `${live.vy.toFixed(2)} m/s`, tone: 'blue' },
  { key: 'R', label: 'R', value: `${live.range.toFixed(2)} m`, tone: 'purple' },
  { key: 'H', label: 'Hₘₐₓ', value: `${live.hmax.toFixed(2)} m`, tone: 'amber' },
])

const displayLegend = computed(() => {
  const base = props.meta.docs.legend ?? []
  if (compareTrail.value) return base
  return base.filter((item) => item.label !== '对比轨迹')
})

const challengeCards = computed(() => {
  const list = props.meta.docs.challenges ?? []
  return list.map((c) => ({
    ...c,
    status: challengeStatus(c, pedagogyCtx.value),
    hintOpen: !!revealedHints[c.id],
  }))
})

function defaultsFromMeta() {
  for (const p of props.meta.params) {
    params[p.key] = p.default
  }
}

function worldBounds() {
  const v0 = Number(params.v0 ?? 20)
  const range = Math.max(10, Number(live.range || 10) * 1.15, (v0 * v0) / 9.8)
  // 坐标系上移：按固定箭头比例为 |v|≤v0 预留下方/右侧空间，不缩短箭头
  const arrowPad = v0 * VELOCITY_ARROW_SCALE * 1.25
  return {
    xMin: -Math.max(2, arrowPad * 0.35),
    xMax: range * 1.08 + arrowPad,
    yMin: -arrowPad,
    yMax: Math.max(8, Number(live.hmax) * 1.45 + 4),
  }
}

function ensureModel() {
  if (!model) model = getModelFactory(props.meta.model)()
  model.init({ ...params })
  series = createEmptySeries()
}

function paint() {
  if (!model) return
  const snap = model.observe()
  live.t = snap.time
  live.x = Number(snap.values.x ?? 0)
  live.y = Number(snap.values.y ?? 0)
  live.vx = Number(snap.values.vx ?? 0)
  live.vy = Number(snap.values.vy ?? 0)
  live.speed = Number(snap.values.speed ?? 0)
  live.hmax = Number(snap.values.hmax ?? 0)
  live.range = Number(snap.values.range ?? 0)
  live.tmax = Number(snap.values.tmax ?? 0)
  live.flightTime = Number(snap.values.flightTime ?? 0)

  if (activeView.value === 'main2d' && canvasHost) {
    drawProjectileFrame(canvasHost, snap, worldBounds(), {
      showDecomp: true,
      compare: compareTrail.value,
      velocityScale: VELOCITY_ARROW_SCALE,
    })

  }
  if (activeView.value === 'scene3d' && threeHost && ball && trailLine) {
    syncProjectileThree(threeHost, ball, trailLine, {
      x: live.x,
      y: live.y,
      path: snap.trails?.path ?? [],
    })
    updateGhostTrail(snap)
  }
  if (activeView.value === 'chart' && chartEl.value) {
    pushSample(series, snap, 'y')
    drawLineChart(chartEl.value, series, { yLabel: 'y(t)' })
  }
}

function updateGhostTrail(snap: ReturnType<PhysicsModel['observe']>) {
  if (!ghostLine) return
  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const G = 9.8
  const T = (2 * v0 * Math.sin(th)) / G
  const n = 48
  const positions = new Float32Array((n + 1) * 3)
  for (let i = 0; i <= n; i++) {
    const t = (T * i) / n
    positions[i * 3] = v0 * Math.cos(th) * t
    positions[i * 3 + 1] = Math.max(0, v0 * Math.sin(th) * t - 0.5 * G * t * t)
    positions[i * 3 + 2] = 0
  }
  ghostLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  ghostLine.geometry.setDrawRange(0, n + 1)
  ghostLine.geometry.attributes.position!.needsUpdate = true
  ghostLine.computeLineDistances()
}

function tick(ts: number) {
  if (!playing.value || !model) {
    raf = 0
    return
  }
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, ((ts - lastTs) / 1000) * speed.value)
  lastTs = ts
  model.step(dt)
  paint()
  const snap = model.observe()
  if (Number(snap.values.done ?? 0) === 1) {
    playing.value = false
    raf = 0
    return
  }
  raf = requestAnimationFrame(tick)
}

function play() {
  scrubbing.value = false
  playing.value = true
  lastTs = 0
  if (!raf) raf = requestAnimationFrame(tick)
}

function pause() {
  playing.value = false
}

function reset() {
  pause()
  scrubbing.value = false
  ensureModel()
  paint()
}

function onParamChange() {
  ensureModel()
  model?.setParams?.({ ...params })
  scrubbing.value = false
  paint()
}

function onScrub(e: Event) {
  const el = e.target as HTMLInputElement
  const t = Number(el.value)
  pause()
  scrubbing.value = true
  if (!model) ensureModel()
  model?.seek?.(t)
  // if seek missing, fall back to step loop from reset
  if (model && !model.seek) {
    model.init({ ...params })
    let acc = 0
    while (acc < t - 1e-9) {
      model.step(0.01)
      acc += 0.01
      if (Number(model.observe().values.done ?? 0) === 1) break
    }
  }
  paint()
}

function keepCompare() {
  if (!model) return
  const snap = model.observe()
  const theory: number[][] = []
  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const G = 9.8
  const T = (2 * v0 * Math.sin(th)) / G
  const n = 64
  for (let i = 0; i <= n; i++) {
    const tt = (T * i) / n
    const x = v0 * Math.cos(th) * tt
    const y = Math.max(0, v0 * Math.sin(th) * tt - 0.5 * G * tt * tt)
    theory.push([x, y])
  }
  compareTrail.value = {
    path: theory,
    label: `θ=${angle}°`,
  }
  paint()
}

function clearCompare() {
  compareTrail.value = null
  paint()
}

function toggleHint(id: string) {
  revealedHints[id] = !revealedHints[id]
}

function bindingTex(labelTex: string, valueKey: string, unit?: string, digits?: number) {
  return formatBinding({ labelTex, valueKey, unit, digits }, pedagogyCtx.value)
}

function setupThree() {
  if (!threeEl.value) return
  threeHost?.dispose()
  threeHost = createThreeHost(threeEl.value)
  threeHost.setAutoRotate(autoRotate.value)

  const geo = new THREE.SphereGeometry(0.7, 28, 20)
  const mat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.25,
    roughness: 0.35,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.25,
  })
  ball = new THREE.Mesh(geo, mat)
  threeHost.scene.add(ball)

  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  trailLine = new THREE.Line(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }),
  )
  threeHost.scene.add(trailLine)

  const ghostGeo = new THREE.BufferGeometry()
  ghostGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  ghostLine = new THREE.Line(
    ghostGeo,
    new THREE.LineDashedMaterial({
      color: 0xf97316,
      dashSize: 1.2,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.7,
    }),
  )
  threeHost.scene.add(ghostLine)
}

function setupCanvas() {
  if (!canvas2dEl.value) return
  canvasHost?.dispose()
  canvasHost = createCanvas2DHost(canvas2dEl.value)
}

function onResize() {
  canvasHost?.resize()
  threeHost?.resize()
  paint()
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value
  threeHost?.setAutoRotate(autoRotate.value)
}

function resetView() {
  threeHost?.resetView()
}

function clampLegend(x: number, y: number, host: HTMLElement, el: HTMLElement) {
  const maxX = Math.max(0, host.clientWidth - el.offsetWidth - 4)
  const maxY = Math.max(0, host.clientHeight - el.offsetHeight - 4)
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
  }
}

function onLegendPointerDown(e: PointerEvent) {
  const el = legendEl.value
  if (!el) return
  const host = el.parentElement
  if (!host) return
  legendHostEl = host
  legendDragging.value = true
  const rect = el.getBoundingClientRect()
  const hostRect = host.getBoundingClientRect()
  if (legendPos.x === null) {
    legendPos.x = rect.left - hostRect.left
    legendPos.y = rect.top - hostRect.top
  }
  legendDragOffsetX = e.clientX - rect.left
  legendDragOffsetY = e.clientY - rect.top
  el.setPointerCapture(e.pointerId)
}

function onLegendPointerMove(e: PointerEvent) {
  if (!legendDragging.value || legendPos.x === null) return
  const el = legendEl.value
  const host = legendHostEl
  if (!el || !host) return
  const hostRect = host.getBoundingClientRect()
  const next = clampLegend(
    e.clientX - hostRect.left - legendDragOffsetX,
    e.clientY - hostRect.top - legendDragOffsetY,
    host,
    el,
  )
  legendPos.x = next.x
  legendPos.y = next.y
}

function onLegendPointerUp(e: PointerEvent) {
  if (!legendDragging.value) return
  legendDragging.value = false
  legendEl.value?.releasePointerCapture(e.pointerId)
  legendHostEl = null
}

const viewTabs = computed(() => props.meta.views)
const hasSteps = computed(() => (props.meta.docs.steps?.length ?? 0) > 0)
const hasChallenges = computed(() => (props.meta.docs.challenges?.length ?? 0) > 0)
const canScrub = computed(() => live.flightTime > 0)
const conceptParagraphs = computed(() => {
  const c = props.meta.docs.concept
  if (!c) return [] as string[]
  return Array.isArray(c) ? c : [c]
})
const hasAnalysis = computed(() => hasSteps.value || conceptParagraphs.value.length > 0)

watch(activeView, async (id) => {
  await Promise.resolve()
  if (id === 'main2d') setupCanvas()
  if (id === 'scene3d') setupThree()
  paint()
})

onMounted(() => {
  defaultsFromMeta()
  ensureModel()
  setupCanvas()
  paint()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  pause()
  if (raf) cancelAnimationFrame(raf)
  canvasHost?.dispose()
  threeHost?.dispose()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="player" :class="{ 'with-analysis': showAnalysis && hasAnalysis }">
    <aside class="side console">
      <router-link class="back" to="/">← 目录</router-link>
      <div class="eyebrow">{{ meta.subject }} · {{ meta.category }}</div>
      <h1>{{ meta.docs.title }}</h1>
      <p class="summary">{{ meta.docs.summary }}</p>

      <section class="panel">
        <header class="panel-h">动态控制台</header>
        <div class="params">
          <label v-for="p in meta.params" :key="p.key" class="param">
            <div class="param-top">
              <span>{{ p.label }} <small v-if="p.unit">({{ p.unit }})</small></span>
              <strong v-if="p.kind === 'number'">{{ params[p.key] }}</strong>
            </div>
            <input
              v-if="p.kind === 'number'"
              type="range"
              :min="p.min"
              :max="p.max"
              :step="p.step ?? 1"
              v-model.number="params[p.key] as number"
              @input="onParamChange"
            />
          </label>
        </div>

        <div class="controls">
          <button type="button" class="primary" @click="play" :disabled="playing">播放</button>
          <button type="button" @click="pause" :disabled="!playing">暂停</button>
          <button type="button" @click="reset">复位</button>
          <label class="speed">
            倍率
            <select v-model.number="speed">
              <option :value="0.5">0.5×</option>
              <option :value="1">1×</option>
              <option :value="2">2×</option>
            </select>
          </label>
        </div>

        <label v-if="canScrub" class="scrub">
          <div class="param-top">
            <span>时间轴 t</span>
            <strong>{{ live.t.toFixed(2) }} / {{ live.flightTime.toFixed(2) }} s</strong>
          </div>
          <input
            type="range"
            :min="0"
            :max="live.flightTime"
            :step="0.01"
            :value="live.t"
            @input="onScrub"
          />
        </label>

        <div class="compare-actions">
          <button type="button" @click="keepCompare">保留对比</button>
          <button type="button" :disabled="!compareTrail" @click="clearCompare">清除对比</button>
        </div>
      </section>

      <section class="panel">
        <header class="panel-h">实时读数</header>
        <dl class="readout-list">
          <div v-for="r in readouts" :key="r.key" class="row" :data-tone="r.tone">
            <dt>{{ r.label }}</dt>
            <dd>{{ r.value }}</dd>
          </div>
        </dl>
        <p v-if="meta.docs.insight" class="insight">{{ meta.docs.insight }}</p>
      </section>

      <section v-if="hasChallenges" class="panel challenges">
        <header class="panel-h">引导挑战</header>
        <article
          v-for="c in challengeCards"
          :key="c.id"
          class="challenge"
          :data-status="c.status"
        >
          <div class="challenge-top">
            <span class="badge">{{ c.status === 'pass' ? '已达成' : '进行中' }}</span>
            <p>{{ c.prompt }}</p>
          </div>
          <button type="button" class="hint-btn" @click="toggleHint(c.id)">
            {{ c.hintOpen ? '收起提示' : '查看提示' }}
          </button>
          <p v-if="c.hintOpen" class="hint-body">{{ c.hint }}</p>
        </article>
      </section>

      <button
        v-if="hasAnalysis"
        type="button"
        class="analysis-toggle"
        @click="showAnalysis = !showAnalysis"
      >
        {{ showAnalysis ? '收起详细解析' : '展开详细解析' }}
      </button>
    </aside>

    <aside v-if="showAnalysis && hasAnalysis" class="side analysis">
      <section v-if="conceptParagraphs.length" class="concept">
        <header class="panel-h">概念解释</header>
        <p v-for="(para, i) in conceptParagraphs" :key="i">{{ para }}</p>
      </section>

      <header v-if="hasSteps" class="panel-h">详细解析</header>
      <ol v-if="hasSteps" class="steps">
        <li
          v-for="(step, i) in meta.docs.steps"
          :key="step.id ?? i"
          :class="{ active: scrubbing && step.highlightOn === 'scrub' }"
        >
          <div class="step-badge">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="step-body">
            <h3>{{ step.title }}</h3>
            <p v-if="step.body">{{ step.body }}</p>
            <div v-if="step.formulas?.length" class="step-formulas">
              <KatexFormula v-for="(f, j) in step.formulas" :key="j" :tex="f" display />
            </div>
            <div v-if="step.bindings?.length" class="step-bindings">
              <KatexFormula
                v-for="(b, j) in step.bindings"
                :key="j"
                :tex="bindingTex(b.labelTex, b.valueKey, b.unit, b.digits)"
                display
              />
            </div>
          </div>
        </li>
      </ol>
      <div v-if="meta.docs.objectives?.length" class="objectives">
        <header class="panel-h">教学目标</header>
        <ul>
          <li v-for="(o, i) in meta.docs.objectives" :key="i">{{ o }}</li>
        </ul>
      </div>
    </aside>

    <section class="stage">
      <div class="tabs">
        <button
          v-for="v in viewTabs"
          :key="v.id"
          type="button"
          :class="{ active: activeView === v.id }"
          @click="activeView = v.id"
        >
          {{ v.title }}
        </button>
      </div>

      <div class="viewport dark" v-show="activeView === 'main2d'">
        <canvas ref="canvas2dEl"></canvas>
        <div
          v-if="displayLegend.length"
          ref="legendEl"
          class="hud-legend"
          :class="{ dragging: legendDragging }"
          :style="legendStyle"
          @pointerdown="onLegendPointerDown"
          @pointermove="onLegendPointerMove"
          @pointerup="onLegendPointerUp"
          @pointercancel="onLegendPointerUp"
        >
          <div class="hud-legend-title">图例 · 可拖拽</div>
          <div v-for="(item, i) in displayLegend" :key="i" class="hud-item">
            <i :style="{ background: item.color }" />
            {{ item.label }}
          </div>
        </div>
      </div>

      <div class="viewport dark" v-show="activeView === 'scene3d'">
        <canvas ref="threeEl"></canvas>
        <div class="hud-bar">
          <button type="button" @click="resetView">重置视角</button>
          <button type="button" :class="{ on: autoRotate }" @click="toggleAutoRotate">
            {{ autoRotate ? '停止旋转' : '自动旋转' }}
          </button>
        </div>
        <div class="hud-hint">拖拽旋转 · 滚轮缩放</div>
      </div>

      <div class="viewport dark" v-show="activeView === 'chart'">
        <canvas ref="chartEl"></canvas>
      </div>

      <div class="viewport docs" v-show="activeView === 'docs'">
        <section v-if="conceptParagraphs.length" class="docs-concept">
          <h2>概念解释</h2>
          <p v-for="(para, i) in conceptParagraphs" :key="i">{{ para }}</p>
        </section>
        <h2>教学目标</h2>
        <ul>
          <li v-for="(o, i) in meta.docs.objectives ?? []" :key="i">{{ o }}</li>
        </ul>
        <h2>公式</h2>
        <div class="formulas">
          <KatexFormula v-for="(f, i) in meta.docs.formulas ?? []" :key="i" :tex="f" display />
        </div>
      </div>
    </section>
  </div>
</template>
