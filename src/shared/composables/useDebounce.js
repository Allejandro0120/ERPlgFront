import { onBeforeUnmount } from 'vue'

export function useDebounce(fn, delay) {
  let timer = null

  function debounced(...args) {
    cancel()
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onBeforeUnmount(cancel)

  return { debounced, cancel }
}
