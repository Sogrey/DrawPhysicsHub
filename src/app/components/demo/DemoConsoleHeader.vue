<script setup lang="ts">
defineProps<{
  subject: string
  category: string
  title: string
  summary: string
}>()
</script>

<template>
  <div class="demo-console-header">
    <router-link class="back" to="/">← 目录</router-link>
    <div class="eyebrow">{{ subject }} · {{ category }}</div>
    <h1>{{ title }}</h1>
    <p class="summary">{{ summary }}</p>
  </div>
</template>
