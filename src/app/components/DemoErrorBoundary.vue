<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { t } from '@/app/i18n'

const props = defineProps<{
  /** 变化时清除错误并 remount 子树 */
  resetKey?: string | number
}>()

const emit = defineEmits<{ retry: [] }>()

const error = ref<Error | null>(null)
const remountKey = ref(0)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  return false
})

watch(
  () => props.resetKey,
  () => {
    error.value = null
    remountKey.value += 1
  },
)

function retry() {
  error.value = null
  remountKey.value += 1
  emit('retry')
}
</script>

<template>
  <div v-if="error" class="demo-error">
    <h2>{{ t('error.title') }}</h2>
    <p class="demo-error-msg">{{ error.message }}</p>
    <div class="demo-error-actions">
      <button type="button" class="btn-primary" @click="retry">{{ t('error.retry') }}</button>
      <router-link class="btn-link" to="/">{{ t('error.back') }}</router-link>
    </div>
  </div>
  <div v-else :key="remountKey" class="demo-error-host">
    <slot />
  </div>
</template>
