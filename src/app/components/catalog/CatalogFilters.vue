<script setup lang="ts">
import { t } from '@/app/i18n'

defineProps<{
  q: string
  subject: string
  tag: string
  subjects: string[]
  tags: string[]
  onlyNew: boolean
  newCount: number
}>()

const emit = defineEmits<{
  'update:q': [string]
  'update:subject': [string]
  'update:tag': [string]
  'update:onlyNew': [boolean]
}>()
</script>

<template>
  <div class="catalog-filters">
    <div class="catalog-filters-row">
      <label class="catalog-search">
        <span class="sr-only">{{ t('catalog.search') }}</span>
        <input
          type="search"
          :value="q"
          :placeholder="t('catalog.search')"
          @input="emit('update:q', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label class="catalog-select">
        <span class="sr-only">{{ t('catalog.subjectAll') }}</span>
        <select
          :value="subject"
          @change="emit('update:subject', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('catalog.subjectAll') }}</option>
          <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <button
        v-if="newCount > 0"
        type="button"
        class="catalog-new-toggle"
        :class="{ active: onlyNew }"
        :title="t('catalog.newHint')"
        :aria-pressed="onlyNew"
        @click="emit('update:onlyNew', !onlyNew)"
      >
        {{ t('catalog.onlyNew') }}
        <span class="catalog-new-toggle-count">{{ newCount }}</span>
      </button>
    </div>
    <div class="catalog-tags" role="list">
      <button
        type="button"
        class="catalog-tag-chip"
        :class="{ active: !tag }"
        @click="emit('update:tag', '')"
      >
        {{ t('catalog.tagAll') }}
      </button>
      <button
        v-for="tg in tags"
        :key="tg"
        type="button"
        class="catalog-tag-chip"
        :class="{ active: tag === tg }"
        @click="emit('update:tag', tag === tg ? '' : tg)"
      >
        {{ tg }}
      </button>
    </div>
  </div>
</template>
