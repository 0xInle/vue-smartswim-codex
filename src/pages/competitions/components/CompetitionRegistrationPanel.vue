<template>
  <Teleport to="body">
    <Transition name="competition-registration-modal">
      <div
        v-if="open && card"
        class="competition-registration"
        :class="`competition-registration--${state.mode}`"
        @click.self="emit('close')"
      >
        <div
          ref="dialogRef"
          class="competition-registration__dialog"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
        >
          <button
            type="button"
            class="competition-registration__close btn-reset"
            aria-label="Закрыть окно регистрации"
            @click="emit('close')"
          >
            <span></span>
            <span></span>
          </button>

          <div class="competition-registration__shell">
            <CompetitionRegistrationContent
              :card="card"
              :state="state"
              :countdown-parts="countdownParts"
              :position-url="positionUrl"
              :documents-route="documentsRoute"
            />

            <div v-if="accordionSections.length" class="competition-registration__faq">
              <CompetitionFaqAccordion variant="registration" :sections="accordionSections" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import CompetitionRegistrationContent from './CompetitionRegistrationContent.vue'
import CompetitionFaqAccordion from './CompetitionFaqAccordion.vue'
import { useCompetitionRegistrationPanel } from '@/pages/competitions/composables/useCompetitionRegistrationPanel'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  card: {
    type: Object,
    default: null,
  },
  competitionRegistration: {
    type: Object,
    default: () => ({}),
  },
  competitionFaqSections: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close'])
const {
  accordionSections,
  countdownParts,
  dialogRef,
  documentsRoute,
  positionUrl,
  state,
} = useCompetitionRegistrationPanel(props, emit)
</script>

<style scoped>
.competition-registration {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #0d1e303d, #0d1e3070), color-mix(in srgb, var(--light-blue) 18%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  z-index: 260;
}

.competition-registration__dialog {
  position: relative;
  width: min(80vw, 1120px);
  height: min(80vh, 820px);
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 10%, transparent);
  box-shadow: 0 24px 60px color-mix(in srgb, var(--black) 18%, transparent);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  overflow: hidden;
  outline: none;
}

.competition-registration__close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: var(--white);
  box-shadow: 0 8px 20px rgb(from var(--black) r g b / 10%);
  z-index: 2;
}

.competition-registration__close span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--black);
}

.competition-registration__close span:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.competition-registration__close span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.competition-registration__shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 22px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 6px 8px;
}

.competition-registration__faq {
  display: grid;
  gap: 16px;
  width: min(100%, 75%);
  margin-top: 4px;
  margin-inline: auto;
  padding: 18px 0 8px;
  border-top: 1px solid color-mix(in srgb, var(--white) 22%, transparent);
}

.competition-registration-modal-enter-active,
.competition-registration-modal-leave-active {
  transition: opacity 0.24s ease;
}

.competition-registration-modal-enter-active .competition-registration__dialog,
.competition-registration-modal-leave-active .competition-registration__dialog {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.competition-registration-modal-enter-from,
.competition-registration-modal-leave-to {
  opacity: 0;
}

.competition-registration-modal-enter-from .competition-registration__dialog,
.competition-registration-modal-leave-to .competition-registration__dialog {
  opacity: 0;
  transform: translateY(22px) scale(0.98);
}
@media (max-width: 768px) {
  .competition-registration {
    padding: 12px;
  }

  .competition-registration__dialog {
    width: min(92vw, 100%);
    height: min(90vh, 100%);
    padding: 18px;
  }

  .competition-registration__faq {
    width: 100%;
  }
}
</style>
