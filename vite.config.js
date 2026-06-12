import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vue-smartswim-codex/' : '/',
  plugins: [vue(), command === 'serve' ? vueDevTools() : null, svgLoader()].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          const normalizedId = id.replace(/\\/g, '/')

          if (normalizedId.includes('/node_modules/@element-plus/icons-vue/')) {
            return 'element-plus-icons'
          }

          if (normalizedId.includes('/node_modules/element-plus/es/components/')) {
            const componentMatch = normalizedId.match(
              /\/node_modules\/element-plus\/es\/components\/([^/]+)/,
            )

            return componentMatch ? `element-plus-${componentMatch[1]}` : 'element-plus-core'
          }

          if (
            normalizedId.includes('/node_modules/element-plus/') ||
            normalizedId.includes('/node_modules/@element-plus/')
          ) {
            return 'element-plus-core'
          }

          if (normalizedId.includes('/node_modules/@supabase/supabase-js/')) {
            return 'supabase'
          }

          if (
            normalizedId.includes('/node_modules/vue/') ||
            normalizedId.includes('/node_modules/@vue/') ||
            normalizedId.includes('/node_modules/pinia/') ||
            normalizedId.includes('/node_modules/vue-router/')
          ) {
            return 'vue-core'
          }

          return 'vendor'
        },
      },
    },
  },
}))
