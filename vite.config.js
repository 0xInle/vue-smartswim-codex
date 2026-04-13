import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

function normalizeBasePath(basePath) {
  if (!basePath || basePath === '/') {
    return '/'
  }

  const trimmedBasePath = basePath.replace(/^\/+|\/+$/g, '')

  return trimmedBasePath ? `/${trimmedBasePath}/` : '/'
}

function resolveBase(command) {
  if (command !== 'build') {
    return '/'
  }

  const explicitBasePath = normalizeBasePath(process.env.VITE_PUBLIC_BASE)

  if (explicitBasePath !== '/') {
    return explicitBasePath
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

  if (!repositoryName || repositoryName.endsWith('.github.io')) {
    return '/'
  }

  return normalizeBasePath(repositoryName)
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: resolveBase(command),
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

          if (
            normalizedId.includes('/node_modules/element-plus/') ||
            normalizedId.includes('/node_modules/@element-plus/')
          ) {
            return 'element-plus'
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
