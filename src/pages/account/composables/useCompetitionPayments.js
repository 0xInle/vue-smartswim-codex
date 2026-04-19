import { computed, ref, watch } from 'vue'
import { accountMockCompetitionPayments } from '@/pages/account/accountCompetitions.data'
import { COMPETITION_NAME_OPTIONS } from '@/pages/account/utils/accountConstants'
import {
  competitionNameTagType,
  formatCompetitionName,
  formatCompetitionPaymentAmount,
  formatCompetitionPaymentDate,
} from '@/pages/account/utils/accountFormatters'

export function useCompetitionPayments() {
  const competitionPayments = ref(accountMockCompetitionPayments.map((payment) => ({ ...payment })))
  const competitionSearch = ref('')
  const competitionFilter = ref('all')

  const filteredCompetitionPayments = computed(() => {
    const normalizedSearch = competitionSearch.value.trim().toLowerCase()

    return competitionPayments.value.filter((payment) => {
      const matchesCompetition =
        competitionFilter.value === 'all'
          ? true
          : payment.competitionName === competitionFilter.value

      if (!matchesCompetition) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        payment.fullName,
        payment.phone,
        payment.amount,
        payment.paymentDate,
        payment.competitionName,
        formatCompetitionName(payment.competitionName),
        formatCompetitionPaymentAmount(payment.amount),
        formatCompetitionPaymentDate(payment.paymentDate),
        competitionNameTagType(payment.competitionName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  })

  const filteredCompetitionPaymentsTotal = computed(
    () => filteredCompetitionPayments.value.length,
  )

  watch([competitionSearch, competitionFilter], () => {
    // No-op placeholder for future paging/reset logic.
  })

  return {
    competitionPayments,
    competitionSearch,
    competitionFilter,
    competitionOptions: COMPETITION_NAME_OPTIONS,
    filteredCompetitionPayments,
    filteredCompetitionPaymentsTotal,
    formatCompetitionName,
    formatCompetitionPaymentAmount,
    formatCompetitionPaymentDate,
    competitionNameTagType,
  }
}
