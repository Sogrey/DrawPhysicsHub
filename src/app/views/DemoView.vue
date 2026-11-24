<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getDemo, listDemos } from '@/core/physics/registry'
import DemoPlayer from '@/app/components/DemoPlayer.vue'
import DemoErrorBoundary from '@/app/components/DemoErrorBoundary.vue'
import { courseNeighbors } from '@/app/catalog/coursePack'
import { t } from '@/app/i18n'

const props = defineProps<{ subject: string; demoId: string }>()
const meta = computed(() => getDemo(props.demoId))
const boundaryKey = ref(0)

const liveIds = computed(() => new Set(listDemos().map((d) => d.id)))
const neighbors = computed(() => courseNeighbors(props.demoId, liveIds.value))

watch(
  () => props.demoId,
  () => {
    boundaryKey.value += 1
  },
)

function onRetry() {
  boundaryKey.value += 1
}

function demoPath(id: string) {
  const m = getDemo(id)
  const subj = m?.subject ?? props.subject
  return `/s/${encodeURIComponent(subj)}/${id}`
}
</script>

<template>
  <main v-if="meta" class="demo-page">
    <nav v-if="neighbors.lessonTitle" class="course-nav" aria-label="course">
      <router-link class="course-nav-back" to="/?mode=course">{{ t('course.back') }}</router-link>
      <span class="course-nav-lesson">{{ neighbors.lessonTitle }}</span>
      <div class="course-nav-links">
        <router-link
          v-if="neighbors.prev"
          class="course-nav-btn"
          :to="demoPath(neighbors.prev)"
        >
          ← {{ t('course.prev') }}
        </router-link>
        <router-link
          v-if="neighbors.next"
          class="course-nav-btn"
          :to="demoPath(neighbors.next)"
        >
          {{ t('course.next') }} →
        </router-link>
      </div>
    </nav>
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
