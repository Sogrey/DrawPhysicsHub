import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './app/router'
import { registerAllDemos } from './demos'
import './styles/base.css'
import 'katex/dist/katex.min.css'

registerAllDemos()

createApp(App).use(createPinia()).use(router).mount('#app')
