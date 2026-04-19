import { nextTick, onBeforeUnmount, onMounted, onUpdated } from 'vue'

export function useStableTableHeader(tableRef) {
  let bodyScrollElement = null
  let scrollFrameId = 0

  function getTableRoot() {
    const instance = tableRef.value

    if (!instance) {
      return null
    }

    return instance.$el ?? instance
  }

  function syncHeaderPosition() {
    const tableRoot = getTableRoot()

    if (!tableRoot) {
      return
    }

    const headerWrapper = tableRoot.querySelector('.el-table__header-wrapper')
    const headerTable = headerWrapper?.querySelector('table')
    const bodyWrapper =
      tableRoot.querySelector('.el-table__body-wrapper') ||
      tableRoot.querySelector('.el-scrollbar__wrap')

    if (!headerWrapper || !headerTable || !bodyWrapper) {
      return
    }

    const scrollLeft = bodyWrapper.scrollLeft || 0

    headerWrapper.scrollLeft = 0
    headerTable.style.transform = `translateX(${-scrollLeft}px)`
  }

  function handleBodyScroll() {
    if (scrollFrameId) {
      return
    }

    scrollFrameId = window.requestAnimationFrame(() => {
      scrollFrameId = 0
      syncHeaderPosition()
    })
  }

  function detachScrollListener() {
    if (!bodyScrollElement) {
      return
    }

    bodyScrollElement.removeEventListener('scroll', handleBodyScroll)
    bodyScrollElement = null
  }

  function attachScrollListener() {
    const tableRoot = getTableRoot()
    const nextBodyScrollElement =
      tableRoot?.querySelector('.el-table__body-wrapper') ||
      tableRoot?.querySelector('.el-scrollbar__wrap') ||
      null

    if (bodyScrollElement === nextBodyScrollElement) {
      syncHeaderPosition()
      return
    }

    detachScrollListener()
    bodyScrollElement = nextBodyScrollElement

    if (!bodyScrollElement) {
      return
    }

    bodyScrollElement.addEventListener('scroll', handleBodyScroll, { passive: true })
    syncHeaderPosition()
  }

  onMounted(() => {
    void nextTick(() => {
      attachScrollListener()
    })
  })

  onUpdated(() => {
    void nextTick(() => {
      attachScrollListener()
    })
  })

  onBeforeUnmount(() => {
    detachScrollListener()

    if (scrollFrameId) {
      window.cancelAnimationFrame(scrollFrameId)
      scrollFrameId = 0
    }
  })
}
