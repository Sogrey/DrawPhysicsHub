<script setup lang="ts">
export interface ChallengeCardView {
  id: string
  prompt: string
  hint: string
  status: 'pending' | 'pass'
  hintOpen: boolean
}

defineProps<{
  items: ChallengeCardView[]
}>()

const emit = defineEmits<{ toggleHint: [id: string] }>()
</script>

<template>
  <section v-if="items.length" class="panel challenges">
    <header class="panel-h">引导挑战</header>
    <article
      v-for="c in items"
      :key="c.id"
      class="challenge"
      :data-status="c.status"
    >
      <div class="challenge-top">
        <span class="badge">{{ c.status === 'pass' ? '已达成' : '进行中' }}</span>
        <p>{{ c.prompt }}</p>
      </div>
      <button type="button" class="hint-btn" @click="emit('toggleHint', c.id)">
        {{ c.hintOpen ? '收起提示' : '查看提示' }}
      </button>
      <p v-if="c.hintOpen" class="hint-body">{{ c.hint }}</p>
    </article>
  </section>
</template>
