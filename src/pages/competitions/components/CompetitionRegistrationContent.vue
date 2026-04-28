<template>
  <div class="competition-registration__main">
    <div class="competition-registration__head">
      <span class="competition-registration__eyebrow">Регистрация этапа</span>
      <h2 class="competition-registration__title">{{ card.title }}</h2>
      <p class="competition-registration__subtitle">
        {{ formatCompetitionDateLabel(card.date) }}<span v-if="card.place"> · {{ card.place }}</span>
      </p>
    </div>

    <div class="competition-registration__status">
      <template v-if="state.mode === 'upcoming'">
        <p class="competition-registration__status-copy">Регистрация на соревнования откроется через</p>

        <div class="competition-registration__timer" aria-label="Таймер до открытия регистрации">
          <div v-for="part in countdownParts" :key="part.label" class="competition-registration__timer-block">
            <span class="competition-registration__timer-number">{{ part.value }}</span>
            <span class="competition-registration__timer-label">{{ part.label }}</span>
          </div>
        </div>

        <p class="competition-registration__meta">
          Регистрация откроется <span>{{ state.openDateLabel }}</span>
        </p>
        <p class="competition-registration__meta">
          Соревнования состоятся <span>{{ state.competitionDateLabel }}</span>
        </p>
        <p v-if="state.closeNote" class="competition-registration__badge">
          {{ state.closeNote }}
        </p>
      </template>

      <template v-else-if="state.mode === 'open'">
        <p class="competition-registration__status-copy">Регистрация открыта</p>
        <p class="competition-registration__meta">
          Соревнования состоятся <span>{{ state.competitionDateLabel }}</span>
        </p>
        <p v-if="state.closeNote" class="competition-registration__badge">
          {{ state.closeNote }}
        </p>
      </template>

      <template v-else>
        <p class="competition-registration__status-copy">
          {{ state.closedTitle }}
        </p>
        <p class="competition-registration__meta">{{ state.competitionDateLabel }}</p>
        <p v-if="state.closedText" class="competition-registration__badge">
          {{ state.closedText }}
        </p>
      </template>
    </div>

    <div class="competition-registration__actions">
      <a
        v-if="positionUrl"
        class="competition-registration__action competition-registration__action--position"
        :href="positionUrl"
        target="_blank"
        rel="noreferrer"
      >
        Положение
      </a>

      <RouterLink
        v-if="documentsRoute"
        class="competition-registration__action competition-registration__action--documents"
        :to="documentsRoute"
      >
        Документы
      </RouterLink>

      <button
        v-if="state.mode === 'open'"
        type="button"
        class="competition-registration__action competition-registration__action--register btn-reset"
      >
        Зарегистрироваться
      </button>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { formatCompetitionDateLabel } from '@/utils/competitionRegistration'

defineProps({
  card: {
    type: Object,
    required: true,
  },
  state: {
    type: Object,
    required: true,
  },
  countdownParts: {
    type: Array,
    required: true,
  },
  positionUrl: {
    type: String,
    default: '',
  },
  documentsRoute: {
    type: String,
    default: '/documents',
  },
})
</script>

<style scoped>
.competition-registration__main {
  display: grid;
  gap: 18px;
  width: min(100%, 75%);
  margin-inline: auto;
  padding-top: 20px;
}

.competition-registration__head {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding-right: 56px;
  padding-left: 56px;
  text-align: center;
}

.competition-registration__eyebrow {
  display: inline-flex;
  align-self: center;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 56%, var(--white));
}

.competition-registration__title {
  margin: 0;
  font-family: Oswald;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 0.94;
  text-transform: uppercase;
  text-align: center;
}

.competition-registration__subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.competition-registration__status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  min-height: clamp(190px, 26vh, 300px);
  padding: clamp(28px, 4vh, 42px) 18px;
  border: 1px solid color-mix(in srgb, var(--white) 28%, transparent);
  border-radius: 10px;
  background: rgb(from var(--white) r g b / 42%);
  text-align: center;
}

.competition-registration__status-copy {
  margin: 0;
  font-family: Oswald;
  font-size: clamp(22px, 3vw, 30px);
  line-height: 1;
  text-transform: uppercase;
  text-align: center;
}

.competition-registration__timer {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 560px);
}

.competition-registration__timer-block {
  display: grid;
  gap: 6px;
  padding: 14px 10px;
  border: 1px solid color-mix(in srgb, var(--cyan) 28%, var(--white));
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 68%, transparent);
  text-align: center;
}

.competition-registration__timer-number {
  font-family: Oswald;
  font-size: clamp(24px, 4vw, 34px);
  line-height: 1;
}

.competition-registration__timer-label {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--black) 58%, var(--white));
}

.competition-registration__meta {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}

.competition-registration__meta span {
  font-weight: 900;
}

.competition-registration__badge {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--orange) 16%, var(--white));
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
  text-align: center;
}

.competition-registration__actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.competition-registration__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: auto;
  max-width: max-content;
  min-height: 47px;
  padding: 11px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
}

.competition-registration__action--position {
  --button-bg: var(--button-cyan-bg);
  --button-hover-bg: var(--button-cyan-hover-bg);
  --button-focus-color: var(--cyan);
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

.competition-registration__action--documents {
  --button-bg: var(--button-light-blue-bg);
  --button-hover-bg: var(--button-light-blue-hover-bg);
  --button-focus-color: var(--light-blue);
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

.competition-registration__action--register {
  --button-bg: color-mix(in srgb, #2f8f5b 90%, transparent);
  --button-hover-bg: color-mix(in srgb, #2f8f5b 72%, transparent);
  --button-focus-color: #2f8f5b;
  --button-text: var(--black);
  background-color: var(--button-current-bg, var(--button-bg));
  color: var(--button-text);
}

@media (max-width: 768px) {
  .competition-registration__main {
    width: 100%;
    padding-top: 18px;
  }

  .competition-registration__head {
    padding-right: 0;
    padding-left: 0;
  }

  .competition-registration__timer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-registration__actions {
    flex-direction: column;
  }

  .competition-registration__action {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .competition-registration__status {
    padding: 16px;
  }

  .competition-registration__timer {
    grid-template-columns: 1fr;
  }
}
</style>
