<script setup lang="ts">
import { computed } from 'vue'
import { getDemo } from '@/core/physics/registry'
import DemoPlayer from '@/app/components/DemoPlayer.vue'

const props = defineProps<{ subject: string; demoId: string }>()
const meta = computed(() => getDemo(props.demoId))
</script>

<template>
  <main class="demo-page" v-if="meta">
    <DemoPlayer :meta="meta" />
  </main>
  <main class="page" v-else>
    <p>未找到演示：{{ demoId }}</p>
    <router-link to="/">返回目录</router-link>
  </main>
</template>
