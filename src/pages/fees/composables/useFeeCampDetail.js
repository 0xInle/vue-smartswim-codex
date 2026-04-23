import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getFeeCampBySlug } from '@/pages/fees/feesData'
import { publicAsset } from '@/utils/publicAsset'

export function useFeeCampDetail() {
  const route = useRoute()
  const camp = computed(() => getFeeCampBySlug(route.params.slug))
  const timelineItemRefs = ref([])
  const visibleTimelineItems = ref([])
  const programSectionStyle = {
    '--fee-program-image': `url(${publicAsset('/images/16-img.webp')})`,
  }

  let timelineObserver

  function setTimelineItemRef(element, index) {
    if (!element) {
      return
    }

    timelineItemRefs.value[index] = element
  }

  function setupTimelineObserver() {
    timelineObserver?.disconnect()
    visibleTimelineItems.value = camp.value?.dailySchedule.map(() => false) ?? []
    timelineItemRefs.value = []

    timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.timelineIndex)

          if (entry.isIntersecting && Number.isFinite(index)) {
            visibleTimelineItems.value[index] = true
            timelineObserver?.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px',
      },
    )
  }

  function resetScrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, 80)
  }

  onMounted(() => {
    resetScrollToTop()
  })

  watch(
    camp,
    async () => {
      resetScrollToTop()
      setupTimelineObserver()
      await nextTick()

      timelineItemRefs.value.forEach((element, index) => {
        if (!element) {
          return
        }

        element.dataset.timelineIndex = String(index)
        timelineObserver?.observe(element)
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    timelineObserver?.disconnect()
  })

  return {
    camp,
    programSectionStyle,
    setTimelineItemRef,
    visibleTimelineItems,
  }
}
