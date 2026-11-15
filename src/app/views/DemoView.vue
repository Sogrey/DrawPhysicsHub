<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getDemo } from '@/core/physics/registry'
import DemoPlayer from '@/app/components/DemoPlayer.vue'
import DemoErrorBoundary from '@/app/components/DemoErrorBoundary.vue'
import { t } from '@/app/i18n'

const props = defineProps<{ subject: string; demoId: string }>()
const meta = computed(() => getDemo(props.demoId))
const boundaryKey = ref(0)

watch(
  () => props.demoId,
  () => {
    boundaryKey.value += 1
  },
)

function onRetry() {
  boundaryKey.value += 1
}
</script>

<template>
  <main v-if="meta" class="demo-page">
    <DemoErrorBoundary :reset-key="`${demoId}-${boundaryKey}`" @retry="onRetry">
      <DemoPlayer :key="`${demoId}-${boundaryKey}`" :meta="meta" />
    </DemoErrorBoundary>
  </main>
  <main v-else class="page">
    <h2>{{ t('error.title') }}</h2>
    <p>{{ t('error.missing', { id: demoId }) }}</p>
    <router-link to="/">{{ t('error.back') }}</router-link>
  </main>
</template>
