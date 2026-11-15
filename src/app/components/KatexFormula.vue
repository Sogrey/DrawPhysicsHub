<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'

const props = defineProps<{ tex: string; display?: boolean }>()

const html = computed(() => {
  try {
    return katex.renderToString(props.tex, {
      throwOnError: false,
      displayMode: !!props.display,
    })
  } catch {
    return props.tex
  }
})
</script>

<template>
  <span class="katex-host" v-html="html" />
</template>
