import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
