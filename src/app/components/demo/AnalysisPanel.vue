<script setup lang="ts">
import type { DemoAnalysisStep } from '@/core/physics/types'
import KatexFormula from '../KatexFormula.vue'

defineProps<{
  steps?: DemoAnalysisStep[]
  objectives?: string[]
  scrubbing?: boolean
  bindingTex: (labelTex: string, valueKey: string, unit?: string, digits?: number) => string
}>()
</script>

<template>
  <aside class="side analysis">
    <div class="analysis-inner">
      <header v-if="steps?.length" class="panel-h">详细解析</header>
      <ol v-if="steps?.length" class="steps">
        <li
          v-for="(step, i) in steps"
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
      <div v-if="objectives?.length" class="objectives">
        <header class="panel-h">教学目标</header>
        <ul>
          <li v-for="(o, i) in objectives" :key="i">{{ o }}</li>
        </ul>
      </div>
    </div>
  </aside>
</template>
