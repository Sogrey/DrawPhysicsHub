<script setup lang="ts">
import { RouterView } from 'vue-router'
import { t } from '@/app/i18n'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link class="brand" to="/">DrawPhysicsHub</router-link>
      <span class="tag">{{ t('app.tag') }}</span>
    </header>
    <RouterView />
  </div>
</template>
