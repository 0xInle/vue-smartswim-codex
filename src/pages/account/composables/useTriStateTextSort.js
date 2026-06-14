import { ref } from 'vue'

const accountSortCollator = new Intl.Collator('ru', {
  sensitivity: 'base',
  numeric: true,
})

export function useTriStateTextSort(initialKey = '', { initialDirection = 'asc' } = {}) {
  const sortKey = ref(initialKey)
  const sortDirection = ref(initialDirection)

  function toggleSort(nextKey) {
    if (sortKey.value !== nextKey) {
      sortKey.value = nextKey
      sortDirection.value = initialDirection
      return
    }

    if (sortDirection.value === initialDirection) {
      sortDirection.value = initialDirection === 'asc' ? 'desc' : 'asc'
      return
    }

    sortKey.value = ''
    sortDirection.value = initialDirection
  }

  function getSortState(key) {
    return {
      isActive: sortKey.value === key,
      direction: sortKey.value === key ? sortDirection.value : '',
    }
  }

  function sortItems(items, accessors) {
    if (!sortKey.value) {
      return [...items]
    }

    const accessor = accessors[sortKey.value]

    if (typeof accessor !== 'function') {
      return [...items]
    }

    return [...items].sort((left, right) => {
      const leftValue = normalizeSortValue(accessor(left))
      const rightValue = normalizeSortValue(accessor(right))
      const comparison = accountSortCollator.compare(leftValue, rightValue)

      return sortDirection.value === 'desc' ? -comparison : comparison
    })
  }

  return {
    sortKey,
    sortDirection,
    toggleSort,
    getSortState,
    sortItems,
  }
}

function normalizeSortValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}
