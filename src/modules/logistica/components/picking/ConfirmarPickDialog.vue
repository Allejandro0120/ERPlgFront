<!-- src/modules/logistica/components/picking/ConfirmarPickDialog.vue -->
<template>
  <base-dialog
    color="primary"
    :disable-confirm="!isValid"
    icon="mdi-package-variant-closed-check"
    label-confirm="Confirmar Pick"
    max-width="700"
    :model-value="modelValue"
    :title="dialogTitle"
    @accept="onAccept"
    @update:model-value="onUpdateModelValue"
  >
    <template #content>
      <v-row density="compact">
        <v-col cols="12">
          <v-textarea
            auto-grow
            label="Producto"
            :model-value="pendienteSeleccionado?.NombreProducto"
            no-resize
            prepend-inner-icon="mdi-package-variant"
            readonly
            rows="1"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            label="Código"
            :model-value="pendienteSeleccionado?.CodigoProducto"
            prepend-inner-icon="mdi-barcode"
            readonly
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-if="pendientes.length > 1"
            v-model="selectedIdDetalle"
            item-title="CodigoUbicacion"
            item-value="IdDetalle"
            :items="ubicacionesItems"
            label="Ubicación"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
          />
          <v-text-field
            v-else
            label="Ubicación"
            :model-value="pendienteSeleccionado?.CodigoUbicacion || '-'"
            prepend-inner-icon="mdi-map-marker-outline"
            readonly
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field
            ref="loteRef"
            v-model="lote"
            autofocus
            hint="Escanea o digita el lote físico encontrado"
            label="Lote encontrado"
            persistent-hint
            prepend-inner-icon="mdi-numeric"
            required
            :rules="[rules.required]"
            variant="outlined"
            @keyup.enter="onAccept"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="cantidad"
            :hint="`Cantidad pendiente: ${pendienteSeleccionado?.Cantidad ?? 0}`"
            label="Cantidad encontrada"
            persistent-hint
            prepend-inner-icon="mdi-counter"
            required
            :rules="cantidadRules"
            variant="outlined"
            @keydown="blockKey($event, allow.onlyDigits)"
            @paste="blockPaste($event, allow.onlyDigits)"
          />
        </v-col>
      </v-row>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    // Línea(s) pendiente(s) que coinciden con el producto buscado (de
    // usePicking.buscarPendientesPorCodigo). Cuando hay más de una, son el
    // mismo producto en ubicaciones distintas y se elige cuál pickear.
    pendientes: { type: Array, default: () => [] },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const cantidad = ref('')
  const lote = ref('')
  const loteRef = ref(null)
  const selectedIdDetalle = ref(null)

  const ubicacionesItems = computed(() =>
    props.pendientes.map((p) => ({ ...p, CodigoUbicacion: p.CodigoUbicacion || 'Sin ubicación' })),
  )

  const pendienteSeleccionado = computed(
    () =>
      props.pendientes.find((p) => p.IdDetalle === selectedIdDetalle.value) ??
      props.pendientes[0] ??
      null,
  )

  const dialogTitle = computed(() =>
    pendienteSeleccionado.value?.CodigoProducto
      ? `Pick: ${pendienteSeleccionado.value.CodigoProducto}`
      : 'Confirmar Pick',
  )

  const cantidadRules = computed(() => [
    rules.required,
    (v) => {
      const numero = Number(String(v ?? '').replace(',', '.'))
      if (Number.isNaN(numero) || numero < 0) return 'Ingresa una cantidad válida'
      const max = pendienteSeleccionado.value?.Cantidad ?? 0
      return numero <= max || `La cantidad no puede ser mayor a la pendiente (${max})`
    },
  ])

  const isValid = computed(
    () =>
      cantidadRules.value.every((rule) => rule(cantidad.value) === true) &&
      rules.required(lote.value) === true,
  )

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) return
      selectedIdDetalle.value = props.pendientes[0]?.IdDetalle ?? null
      cantidad.value = ''
      lote.value = ''
      nextTick(() => loteRef.value?.focus?.())
    },
  )

  watch(selectedIdDetalle, () => {
    cantidad.value = ''
  })

  function onUpdateModelValue(value) {
    emit('update:modelValue', value)
  }

  function onAccept() {
    if (!isValid.value || !pendienteSeleccionado.value) return
    emit('confirm', {
      idDetalle: pendienteSeleccionado.value.IdDetalle,
      cantidad: cantidad.value,
      lote: lote.value,
    })
  }
</script>

<style scoped></style>
