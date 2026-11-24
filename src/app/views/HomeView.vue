<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listDemos } from '@/core/physics/registry'
import {
  allSubjects,
  allTags,
  buildCatalogItems,
  buildDemoTree,
  filterCatalog,
  type CatalogItem,
} from '@/app/catalog/demoCatalog'
import { COURSE_PACK_V1, resolveLessonDemos } from '@/app/catalog/coursePack'
import CatalogFilters from '@/app/components/catalog/CatalogFilters.vue'
import DemoCard from '@/app/components/catalog/DemoCard.vue'
import { t } from '@/app/i18n'

const route = useRoute()
const router = useRouter()
const mode = ref<'catalog' | 'course'>(route.query.mode === 'course' ? 'course' : 'catalog')

watch(mode, (m) => {
  const next = m === 'course' ? { mode: 'course' } : {}
  router.replace({ query: next })
})

watch(
  () => route.query.mode,
  (m) => {
    mode.value = m === 'course' ? 'course' : 'catalog'
  },
)
const q = ref('')
const subject = ref('')
const tag = ref('')
const onlyNew = ref(false)

const catalog = computed(() => buildCatalogItems(listDemos()))
const byId = computed(() => {
  const m = new Map<string, CatalogItem>()
  for (const item of catalog.value) m.set(item.id, item)
  return m
})
const liveIds = computed(() => new Set(catalog.value.filter((i) => i.status === 'live').map((i) => i.id)))

const subjects = computed(() => allSubjects(catalog.value))
const tags = computed(() => allTags(catalog.value))
const newTotal = computed(() => catalog.value.filter((i) => i.isNew).length)

const filtered = computed(() =>
  filterCatalog(catalog.value, {
    q: q.value,
    subject: subject.value || null,
    tag: tag.value || null,
    includeSoon: !onlyNew.value,
    onlyNew: onlyNew.value,
  }),
)

const tree = computed(() => buildDemoTree(filtered.value))

const liveCount = computed(() => filtered.value.filter((i) => i.status === 'live').length)
const soonCount = computed(() => filtered.value.filter((i) => i.status === 'soon').length)
const newCount = computed(() => filtered.value.filter((i) => i.isNew).length)

const courseChapters = computed(() =>
  COURSE_PACK_V1.map((ch) => ({
    ...ch,
    lessons: ch.lessons
      .map((lesson) => {
        const ids = resolveLessonDemos(lesson, liveIds.value)
        const items = ids.map((id) => byId.value.get(id)).filter(Boolean) as CatalogItem[]
        return { ...lesson, items }
      })
      .filter((l) => l.items.length > 0),
  })).filter((ch) => ch.lessons.length > 0),
)

const courseDemoCount = computed(() =>
  courseChapters.value.reduce((n, ch) => n + ch.lessons.reduce((m, l) => m + l.items.length, 0), 0),
)
</script>

<template>
  <main class="page catalog-page">
    <header class="catalog-hero">
      <div class="catalog-hero-text">
        <h1>{{ mode === 'catalog' ? t('catalog.title') : t('course.title') }}</h1>
        <p class="lead">{{ mode === 'catalog' ? t('catalog.lead') : t('course.lead') }}</p>
      </div>
      <div class="catalog-hero-aside">
        <div class="catalog-mode" role="tablist" aria-label="browse mode">
          <button
            type="button"
            role="tab"
            class="catalog-mode-btn"
            :class="{ active: mode === 'catalog' }"
            :aria-selected="mode === 'catalog'"
            @click="mode = 'catalog'"
          >
            {{ t('catalog.modeCatalog') }}
          </button>
          <button
            type="button"
            role="tab"
            class="catalog-mode-btn"
            :class="{ active: mode === 'course' }"
            :aria-selected="mode === 'course'"
            @click="mode = 'course'"
          >
            {{ t('catalog.modeCourse') }}
          </button>
        </div>
        <p class="catalog-count">
          <template v-if="mode === 'catalog'">
            {{ t('catalog.countMix', { live: liveCount, soon: soonCount }) }}
            <span v-if="newCount > 0" class="catalog-count-new">{{
              t('catalog.countNew', { n: newCount })
            }}</span>
          </template>
          <template v-else>{{ t('course.demos', { n: courseDemoCount }) }}</template>
        </p>
      </div>
    </header>

    <template v-if="mode === 'catalog'">
      <CatalogFilters
        :q="q"
        :subject="subject"
        :tag="tag"
        :subjects="subjects"
        :tags="tags"
        :only-new="onlyNew"
        :new-count="newTotal"
        @update:q="q = $event"
        @update:subject="subject = $event"
        @update:tag="tag = $event"
        @update:only-new="onlyNew = $event"
      />

      <div v-if="!filtered.length" class="catalog-empty">{{ t('catalog.empty') }}</div>

      <section v-for="subj in tree" :key="subj.subject" class="catalog-subject">
        <div class="catalog-subject-head">
          <h2 class="catalog-subject-title">{{ subj.subject }}</h2>
          <span class="catalog-subject-meta">{{ subj.items.length }}</span>
        </div>
        <div class="catalog-grid">
          <DemoCard v-for="item in subj.items" :key="item.id" :item="item" />
        </div>
      </section>
    </template>

    <template v-else>
      <section v-for="ch in courseChapters" :key="ch.id" class="course-chapter">
        <div class="catalog-subject-head">
          <h2 class="catalog-subject-title">{{ ch.title }}</h2>
          <span class="catalog-subject-meta">{{ ch.lessons.length }}</span>
        </div>
        <div v-for="lesson in ch.lessons" :key="lesson.id" class="course-lesson">
          <h3 class="course-lesson-title">{{ lesson.title }}</h3>
          <div class="catalog-grid">
            <DemoCard v-for="item in lesson.items" :key="item.id" :item="item" />
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
