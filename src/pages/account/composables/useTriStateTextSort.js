import { ref } from 'vue'

const accountSortCollator = new Intl.Collator('ru', {
  sensitivity: 'base',
  numeric: true,
})

export function useTriStateTextSort(initialKey = '') {
  const sortKey = ref(initialKey)
  const sortDirection = ref('asc')

  function toggleSort(nextKey) {
    if (sortKey.value !== nextKey) {
      sortKey.value = nextKey
      sortDirection.value = 'asc'
      return
    }

    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
      return
    }

    sortKey.value = ''
    sortDirection.value = 'asc'
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
