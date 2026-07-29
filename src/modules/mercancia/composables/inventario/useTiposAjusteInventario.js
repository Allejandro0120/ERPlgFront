import { ref } from 'vue'
import { inventarioService } from '@/api/services/inventarioService'

const tiposAjuste = ref([])
const loadingTiposAjuste = ref(false)
const tiposAjusteError = ref(null)
let loadPromise = null

export function useTiposAjusteInventario() {
  async function loadTiposAjusteInventario(force = false) {
    if (tiposAjuste.value.length > 0 && !force) {
      return tiposAjuste.value
    }

    if (loadPromise) {
      return loadPromise
    }

    loadingTiposAjuste.value = true
    tiposAjusteError.value = null

    loadPromise = inventarioService
      .getTiposAjusteInv()
      .then((resp) => {
        if (resp?.data?.success) {
          tiposAjuste.value = resp.data.data || []
        }
        return tiposAjuste.value
      })
      .catch((error) => {
        tiposAjusteError.value = error
        throw error
      })
      .finally(() => {
        loadingTiposAjuste.value = false
        loadPromise = null
      })

    return loadPromise
  }

  return {
    tiposAjuste,
    loadingTiposAjuste,
    tiposAjusteError,
    loadTiposAjusteInventario,
  }
}
