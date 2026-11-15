<script setup lang="ts">
import { computed } from 'vue'
import { listDemos } from '@/core/physics/registry'

const demos = computed(() => listDemos())
</script>

<template>
  <main class="page">
    <h1>演示目录</h1>
    <p class="lead">一期从 HelloDemo（抛体）打通「模型 → 多视图渲染」闭环。</p>
    <ul class="demo-list">
      <li v-for="d in demos" :key="d.id">
        <router-link :to="`/s/${encodeURIComponent(d.subject)}/${d.id}`">
          <strong>{{ d.docs.title }}</strong>
          <span>{{ d.subject }} / {{ d.category }}</span>
        </router-link>
      </li>
    </ul>
  </main>
</template>
