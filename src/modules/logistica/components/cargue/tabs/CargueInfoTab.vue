<template>
  <v-row class="mt-2" density="compact">
    <!-- ── Fecha Acta Cargue (solo en ver detalle) ── -->
    <v-col v-if="form.FechaActaCargue" cols="12" sm="4">
      <v-text-field
        id="FechaActaCargue"
        v-model="FechaActaCargueDisplay"
        label="Fecha Acta de Cargue"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- ── Selección de Acta de Recepción (crear y ver) ─────────────────── -->
    <v-col cols="12" :sm="form.FechaActaCargue ? 8 : 12">
      <v-autocomplete
        v-model="actaSeleccionada"
        v-model:search="actaSearch"
        autocomplete="off"
        :clearable="!isReadonly"
        :item-title="actaItemTitle"
        :items="actasItems"
        label="Acta de Recepción"
        :loading="loadingActas"
        no-filter
        :placeholder="isReadonly ? '' : 'Escribe mínimo 1 caracter para buscar'"
        prepend-inner-icon="mdi-script-outline"
        :readonly="isReadonly"
        return-object
        variant="outlined"
        @update:model-value="onActaChange"
        @update:search="onActaSearch"
      />
    </v-col>

    <!-- ── Cedi ───────────────────────────────────────────────────────────── -->
    <v-col cols="12" sm="6">
      <v-text-field
        id="NombreCedi"
        v-model="form.NombreCedi"
        label="Cedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- ── Bodega ─────────────────────────────────────────────────────────── -->
    <v-col cols="12" sm="6">
      <v-text-field
        id="NombreBodega"
        v-model="form.NombreBodega"
        label="Bodega"
        prepend-inner-icon="mdi-door-open"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- ── Observaciones ─────────────────────────────────────────────────── -->
    <v-col cols="12">
      <v-textarea
        v-model="form.Observaciones"
        :clearable="!isReadonly"
        counter="400"
        label="Observaciones de acta de cargue"
        maxlength="400"
        persistent-counter
        :readonly="isReadonly"
        variant="outlined"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { computed, ref, toRefs, watch } from 'vue'
  import { recepcionService } from '@/api/services/recepcionService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useDebounce } from '@/shared/composables/useDebounce'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { unwrapApiData } from '@/shared/utils/unwrapApiData'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['acta-cargada', 'update:form'])

  const { form, isReadonly } = toRefs(props)

  // ─── Display fecha acta de cargue ────────────────────────────────────────
  const FechaActaCargueDisplay = computed(() =>
    props.form.FechaActaCargue ? formatDateTime(props.form.FechaActaCargue) : '',
  )

  // ─── Autocomplete de actas ────────────────────────────────────────────────
  const actaSearch = ref('')
  const actasItems = ref([])
  const actaSeleccionada = ref(null)
  const loadingActas = ref(false)

  function buildActaItem(acta) {
    const numActa = acta.Acta ?? ''
    const fecha = acta.FechaActa ? formatDateTime(acta.FechaActa) : ''
    return {
      ...acta,
      displayName: [numActa, fecha].filter(Boolean).join(' - '),
    }
  }

  function actaItemTitle(item) {
    if (!item) return ''
    return item.displayName ?? buildActaItem(item).displayName
  }

  // En modo "ver" pintamos el acta que ya viene en el form (con su fecha
  // formateada en el label) y evitamos cualquier búsqueda.
  watch(
    () => [props.isReadonly, props.form.ActaRecepcion, props.form.FechaActaRecepcion],
    () => {
      if (!props.isReadonly) return

      if (!props.form.ActaRecepcion) {
        actaSeleccionada.value = null
        actasItems.value = []
        return
      }

      const item = buildActaItem({
        IdActa: props.form.IdActa ?? null,
        Acta: props.form.ActaRecepcion,
        FechaActa: props.form.FechaActaRecepcion,
      })
      actaSeleccionada.value = item
      actasItems.value = [item]
    },
    { immediate: true },
  )

  const { debounced: debouncedBuscarActas, cancel: cancelBuscarActas } = useDebounce(
    buscarActas,
    400,
  )

  function onActaSearch(value) {
    if (props.isReadonly) return // en modo ver no se busca

    if (!value || value.length === 0) {
      cancelBuscarActas()
      actasItems.value = actaSeleccionada.value ? [actaSeleccionada.value] : []
      return
    }
    debouncedBuscarActas(value)
  }

  async function buscarActas(termino) {
    loadingActas.value = true
    try {
      const response = await recepcionService.searchRecepcion(termino)
      actasItems.value = unwrapApiData(response)
    } catch (error) {
      console.error('Error buscando actas:', error)
      $toast.error('No se pudieron cargar las actas de recepción')
    } finally {
      loadingActas.value = false
    }
  }

  async function onActaChange(acta) {
    if (props.isReadonly) return // en modo ver no se permite cambiar la selección

    if (!acta) {
      // Limpiar form al quitar selección
      emit('update:form', {
        ...props.form,
        ActaRecepcion: '',
        FechaActaRecepcion: '',
        NombreCedi: '',
        NombreBodega: '',
        IdCedi: null,
        IdBodega: null,
      })
      emit('acta-cargada', null)
      return
    }

    $loading.show('Cargando información del acta...')
    try {
      const response = await recepcionService.getRecepcionInformacion(acta.IdActa)
      const data = unwrapApiData(response, null)
      if (!data) {
        $toast.error('No se pudo obtener la información del acta')
        return
      }

      // Rellenar form
      emit('update:form', {
        ...props.form,
        IdActaRecepcion: data.IdActaRecepcion ?? acta.IdActa ?? null,
        ActaRecepcion: data.ActaRecepcion,
        FechaActaRecepcion: data.FechaActa,
        NombreCedi: data.NombreCedi,
        NombreBodega: data.NombreBodega,
        IdCedi: data.IdCedi,
        IdBodega: data.IdBodega,
      })

      // Emitir detalles para hidratar la tabla de recepción
      emit('acta-cargada', data)
    } catch (error) {
      console.error('Error cargando acta:', error)
      $toast.error('Error al cargar la información del acta')
    } finally {
      $loading.hide()
    }
  }
</script>
