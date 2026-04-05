import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

function resetScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  })

  window.setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, 120)
}

window.addEventListener('pageshow', resetScrollPosition)
window.addEventListener('load', resetScrollPosition)

resetScrollPosition()

const app = createApp(App)

app.use(createPinia())
app.use(ElementPlus, { size: 'default', zIndex: 3000 })
app.use(router)

await router.isReady()

app.mount('#app')
