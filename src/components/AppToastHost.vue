<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div
        v-if="toastState.isVisible"
        :key="toastState.id"
        class="app-toast"
        :class="{
          'app-toast--success': toastState.type === 'success',
          'app-toast--error': toastState.type === 'error',
        }"
        role="status"
        aria-live="polite"
      >
        {{ toastState.message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useToastState } from '@/utils/toast'

const toastState = useToastState()
</script>

<style scoped>
.app-toast {
  position: fixed;
  top: 3px;
  right: 3px;
  max-width: min(340px, calc(100vw - 12px));
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--white) 18%, transparent);
  border-radius: 10px;
  box-shadow: 0 14px 30px rgb(from var(--black) r g b / 10%);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
  color: var(--black);
  backdrop-filter: blur(14px);
  z-index: 420;
  pointer-events: none;
}

.app-toast--success {
  background: color-mix(in srgb, var(--cyan) 58%, transparent);
}

.app-toast--error {
  background: color-mix(in srgb, var(--orange) 46%, transparent);
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 767px) {
  .app-toast {
    top: 4px;
    right: 4px;
    max-width: min(320px, calc(100vw - 8px));
  }
}
</style>
