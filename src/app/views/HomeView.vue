<script setup lang="ts">
import { computed, ref } from 'vue'
import { listDemos } from '@/core/physics/registry'
import {
  allSubjects,
  allTags,
  buildCatalogItems,
  buildDemoTree,
  filterCatalog,
} from '@/app/catalog/demoCatalog'
import CatalogFilters from '@/app/components/catalog/CatalogFilters.vue'
import DemoCard from '@/app/components/catalog/DemoCard.vue'
import { t } from '@/app/i18n'

const q = ref('')
const subject = ref('')
const tag = ref('')

const catalog = computed(() => buildCatalogItems(listDemos()))
const subjects = computed(() => allSubjects(catalog.value))
const tags = computed(() => allTags(catalog.value))

const filtered = computed(() =>
  filterCatalog(catalog.value, {
    q: q.value,
    subject: subject.value || null,
    tag: tag.value || null,
    includeSoon: true,
  }),
)

const tree = computed(() => buildDemoTree(filtered.value))

const liveCount = computed(() => filtered.value.filter((i) => i.status === 'live').length)
const soonCount = computed(() => filtered.value.filter((i) => i.status === 'soon').length)
</script>

<template>
  <main class="page catalog-page">
    <header class="catalog-hero">
      <div class="catalog-hero-text">
        <h1>{{ t('catalog.title') }}</h1>
        <p class="lead">{{ t('catalog.lead') }}</p>
      </div>
      <p class="catalog-count">
        {{ t('catalog.countMix', { live: liveCount, soon: soonCount }) }}
      </p>
    </header>

    <CatalogFilters
      :q="q"
      :subject="subject"
      :tag="tag"
      :subjects="subjects"
      :tags="tags"
      @update:q="q = $event"
      @update:subject="subject = $event"
      @update:tag="tag = $event"
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
  </main>
</template>
