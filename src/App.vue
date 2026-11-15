<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link class="brand" to="/">DrawPhysicsHub</router-link>
      <span class="tag">物理模型层 · 渲染层</span>
    </header>
    <RouterView />
  </div>
</template>
