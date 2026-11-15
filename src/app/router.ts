import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/app/views/HomeView.vue'
import DemoView from '@/app/views/DemoView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/s/:subject/:demoId', name: 'demo', component: DemoView, props: true },
  ],
})
