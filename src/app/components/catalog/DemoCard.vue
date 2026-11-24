<script setup lang="ts">
import { ref, watch } from 'vue'
import { publicAsset } from '@/app/catalog/assetUrl'
import { PLACEHOLDER_COVER } from '@/app/catalog/catalogPlan'
import type { CatalogItem } from '@/app/catalog/demoCatalog'
import { t } from '@/app/i18n'

const props = defineProps<{ item: CatalogItem }>()
const coverSrc = ref(props.item.cover ?? '')
const imgFailed = ref(false)
const placeholderUrl = publicAsset(PLACEHOLDER_COVER)

watch(
  () => props.item.cover,
  (v) => {
    coverSrc.value = v ?? ''
    imgFailed.value = false
  },
)

function onImgError() {
  // 真实截图缺失时回退通用占位图
  if (coverSrc.value !== placeholderUrl) {
    coverSrc.value = placeholderUrl
    return
  }
  imgFailed.value = true
}
</script>

<template>
  <component
    :is="item.status === 'live' ? 'router-link' : 'div'"
    class="catalog-card"
    :class="{ soon: item.status === 'soon', 'is-new': item.isNew }"
    :to="
      item.status === 'live'
        ? `/s/${encodeURIComponent(item.subject)}/${item.id}`
        : undefined
    "
    :aria-disabled="item.status === 'soon' ? 'true' : undefined"
    :data-new="item.isNew ? 'true' : undefined"
  >
    <div class="catalog-thumb" :data-tone="item.tone" aria-hidden="true">
      <img
        v-if="coverSrc && !imgFailed"
        class="catalog-thumb-img"
        :src="coverSrc"
        :alt="item.title"
        loading="lazy"
        @error="onImgError"
      />
      <svg v-else viewBox="0 0 120 72" class="catalog-thumb-svg">
        <defs>
          <linearGradient :id="`g-${item.id}`" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.35" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="120" height="72" :fill="`url(#g-${item.id})`" />
        <path
          d="M12 52 C28 20 40 20 56 40 S88 64 108 28"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          opacity="0.85"
        />
        <circle cx="56" cy="40" r="4.5" fill="currentColor" opacity="0.9" />
      </svg>
      <span v-if="item.status === 'soon'" class="catalog-badge">{{ t('catalog.soon') }}</span>
      <span
        v-else-if="item.isNew"
        class="catalog-badge catalog-badge-new"
        :title="t('catalog.newHint')"
      >{{ t('catalog.new') }}</span>
    </div>
    <div class="catalog-card-body">
      <strong class="catalog-card-title">{{ item.title }}</strong>
      <span class="catalog-card-meta">{{ item.subject }} / {{ item.category }}</span>
      <div v-if="item.tags.length" class="catalog-card-tags">
        <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="catalog-tag-chip">{{ tag }}</span>
      </div>
      <span v-if="item.status === 'live'" class="catalog-card-cta">{{ t('catalog.open') }} →</span>
      <span v-else class="catalog-card-cta muted">{{ t('catalog.soonHint') }}</span>
    </div>
  </component>
</template>
