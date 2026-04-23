<template>
  <section v-if="competition" class="competition-detail">
    <div class="container">
      <CompetitionDetailHero :competition="competition" />

      <div class="competition-detail__calendar">
        <div class="competition-detail__cards">
          <CompetitionStageCard
            v-for="card in competition.cards"
            :key="`${competition.slug}-${card.title}`"
            :card="card"
            :active="
              hasRegistrationFlow &&
              isRegistrationModalOpen &&
              selectedCardKey === getCardKey(card)
            "
            @open-registration="openRegistrationCard(card)"
          />
        </div>
      </div>

      <div v-if="competition.faqSections?.length" class="competition-detail__faq">
        <div class="competition-detail__faq-shell">
          <CompetitionFaqAccordion variant="detail" :sections="competition.faqSections" />
        </div>
      </div>

      <CompetitionFooterImage
        :src="competitionFooterImage"
        alt="Пловец Smart Swim в воде во время тренировки"
      />
    </div>

    <HomeFooterSection />

    <CompetitionRegistrationPanel
      :open="hasRegistrationFlow && isRegistrationModalOpen"
      :card="selectedCard"
      :competition-registration="competition.registration"
      :competition-faq-sections="competition.faqSections"
      @close="closeRegistrationModal"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { getCompetitionBySlug } from './competitionData'
import { publicAsset } from '@/utils/publicAsset'
import CompetitionDetailHero from './components/CompetitionDetailHero.vue'
import CompetitionStageCard from './components/CompetitionStageCard.vue'
import CompetitionFaqAccordion from './components/CompetitionFaqAccordion.vue'
import CompetitionFooterImage from './components/CompetitionFooterImage.vue'
import CompetitionRegistrationPanel from './components/CompetitionRegistrationPanel.vue'

const route = useRoute()

const competition = computed(() => getCompetitionBySlug(route.params.slug))
const selectedCardKey = ref('')
const isRegistrationModalOpen = ref(false)
const competitionFooterImage = publicAsset('/images/20-img.webp')
const hasRegistrationFlow = computed(() => Boolean(competition.value?.registration))

function getCardKey(card) {
  return `${card.title}-${card.date}`
}

function getDefaultCardKey(cards) {
  const upcomingCard = cards.find((card) => card.registration?.status === 'upcoming')
  const openCard = cards.find((card) => card.registration?.status === 'open')

  return getCardKey(upcomingCard || openCard || cards[0])
}

const selectedCard = computed(() => {
  const cards = competition.value?.cards || []

  if (!cards.length || !hasRegistrationFlow.value) {
    return null
  }

  return cards.find((card) => getCardKey(card) === selectedCardKey.value) || cards[0]
})

function openRegistrationCard(card) {
  if (!hasRegistrationFlow.value) {
    return
  }

  selectedCardKey.value = getCardKey(card)
  isRegistrationModalOpen.value = true
}

function closeRegistrationModal() {
  isRegistrationModalOpen.value = false
}

watch(
  competition,
  (nextCompetition) => {
    if (!nextCompetition?.cards?.length || !nextCompetition.registration) {
      selectedCardKey.value = ''
      isRegistrationModalOpen.value = false
      return
    }

    const nextDefaultKey = getDefaultCardKey(nextCompetition.cards)
    const currentCardExists = nextCompetition.cards.some(
      (card) => getCardKey(card) === selectedCardKey.value,
    )

    selectedCardKey.value = currentCardExists ? selectedCardKey.value : nextDefaultKey
    isRegistrationModalOpen.value = false
  },
  { immediate: true },
)
</script>

<style scoped>
.competition-detail__calendar {
  position: relative;
  z-index: 0;
  padding-bottom: 70px;
}

.competition-detail__calendar::after {
  content: '';
  position: absolute;
  top: -24px;
  right: 50%;
  bottom: 0;
  left: calc(50% - 50vw);
  background-color: var(--very-light-blue);
  z-index: -1;
}

.competition-detail__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.competition-detail__faq {
  padding: 70px 0 0;
  margin-bottom: 50px;
}

.competition-detail__faq-shell {
  width: 75%;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .competition-detail__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .competition-detail__faq-shell {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .competition-detail__faq {
    margin-bottom: 30px;
  }

  .competition-detail__cards {
    grid-template-columns: 1fr;
  }
}
</style>
