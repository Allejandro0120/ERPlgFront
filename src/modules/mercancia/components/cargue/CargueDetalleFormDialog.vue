<template>
  <base-dialog
    color="primary"
    :icon="readonly ? 'mdi-map-marker-check' : 'mdi-map-marker-plus'"
    :label-confirm="readonly ? '' : 'Guardar'"
    max-width="800"
    :model-value="modelValue"
    :show-actions="!readonly"
    :title="readonly ? 'Detalle de Asignación' : 'Asignar Ubicación'"
    @accept="submitForm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <!-- Info del producto -->
        <v-card v-if="recepcionItem" class="product-card px-4 py-3" flat rounded="lg">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3 flex-grow-1 min-w-0">
              <div class="product-icon-wrap">
                <v-icon color="primary" icon="mdi-package-variant-closed" size="20" />
              </div>
              <div class="min-w-0">
                <div class="text-body-medium text-brand-grey-1 font-weight-semibold text-wrap">
                  {{ recepcionItem.NombreProducto }}
                </div>
                <div class="text-body-medium text-brand-grey-2 mt-0 font-weight-medium">
                  {{ recepcionItem.CodigoProducto }}
                </div>
              </div>
            </div>

            <!-- Cantidad: azul si asignado, ámbar si pendiente -->
            <v-chip
              class="font-weight-medium"
              :color="readonly ? 'primary' : 'warning'"
              rounded="pill"
              size="default"
              variant="tonal"
            >
              <v-icon
                :icon="readonly ? 'mdi-check-circle-outline' : 'mdi-clock-outline'"
                size="15"
                start
              />
              {{ readonly ? recepcionItem.CantidadAsignada : recepcionItem.CantidadPendiente }}
              {{ readonly ? 'asignadas' : 'pendientes' }}
            </v-chip>
          </div>

          <v-divider class="my-3 border-opacity-20" />

          <v-chip
            class="text-brand-grey-1 font-weight-medium"
            color="default"
            prepend-icon="mdi-label-outline"
            size="default"
            variant="text"
          >
            Lote: {{ recepcionItem.CodLote }}
          </v-chip>
        </v-card>

        <v-row class="mt-8" density="compact">
          <!-- Cascada de ubicación -->
          <v-col cols="12">
            <div class="text-subtitle-2 mb-2 text-medium-emphasis">
              <v-icon icon="mdi-map-marker" size="16" start />
              {{ readonly ? 'Ubicación asignada' : 'Selección de ubicación' }}
            </div>
          </v-col>

          <!-- Cantidad a asignar (solo en modo edición; en readonly ya aparece en el alert) -->
          <v-col v-if="!readonly" cols="12" sm="4">
            <v-text-field
              v-model.number="form.CantidadAsignada"
              label="Cantidad asignada"
              prepend-inner-icon="mdi-counter"
              :rules="cantidadRules"
              type="number"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" sm="4">
            <v-text-field
              v-if="readonly"
              label="Zona"
              :model-value="recepcionItem?.CodigoZona ?? form.CodigoZona ?? ''"
              readonly
              variant="outlined"
            />
            <v-select
              v-else
              v-model="form.IdZona"
              clearable
              item-title="CodZona"
              item-value="IdZona"
              :items="zonas"
              label="Zona"
              :loading="loading.zonas"
              required
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onZonaChange"
            />
          </v-col>

          <v-col cols="6" sm="4">
            <v-text-field
              v-if="readonly"
              label="Pasillo"
              :model-value="recepcionItem?.CodigoPasillo ?? form.CodigoPasillo ?? ''"
              readonly
              variant="outlined"
            />
            <v-select
              v-else
              v-model="form.IdPasillo"
              clearable
              :disabled="!form.IdZona"
              item-title="CodPasillo"
              item-value="IdPasillo"
              :items="pasillos"
              label="Pasillo"
              :loading="loading.pasillos"
              required
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onPasilloChange"
            />
          </v-col>

          <v-col cols="6" sm="4">
            <v-text-field
              v-if="readonly"
              label="Estante"
              :model-value="recepcionItem?.CodigoEstante ?? form.CodigoEstante ?? ''"
              readonly
              variant="outlined"
            />
            <v-select
              v-else
              v-model="form.IdEstante"
              clearable
              :disabled="!form.IdPasillo"
              item-title="CodEstante"
              item-value="IdEstante"
              :items="estantes"
              label="Estante"
              :loading="loading.estantes"
              required
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onEstanteChange"
            />
          </v-col>

          <v-col cols="6" sm="4">
            <v-text-field
              v-if="readonly"
              label="Ubicación"
              :model-value="recepcionItem?.CodigoUbicacion ?? form.CodigoUbicacion ?? ''"
              readonly
              variant="outlined"
            />
            <v-select
              v-else
              v-model="form.IdUbicacion"
              clearable
              :disabled="!form.IdEstante"
              item-title="CodUbicacion"
              item-value="IdUbicacion"
              :items="ubicaciones"
              label="Ubicación"
              :loading="loading.ubicaciones"
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>

          <!-- Observaciones -->
          <v-col cols="12">
            <v-textarea
              v-model="form.Observaciones"
              counter="400"
              label="Observaciones"
              maxlength="400"
              persistent-counter
              :placeholder="readonly ? '' : 'Observaciones de la asignación (opcional)'"
              :readonly="readonly"
              rows="3"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { $toast } from '@/plugins/toast'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    cargueDetalles: { type: Array, default: () => [] },
    recepcionItem: { type: Object, default: null },
    idBodega: { type: Number, default: null },
    readonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const formRef = ref(null)

  const formInitial = {
    CantidadAsignada: null,
    IdZona: null,
    IdPasillo: null,
    IdEstante: null,
    IdUbicacion: null,
    Observaciones: '',
  }

  const form = ref({ ...formInitial })
  // ui ref requerido por el composable (aunque aquí no lo usamos para ids de selects)
  const ui = ref({})

  // ─── Cascada de infraestructura ───────────────────────────────────────────
  const {
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading,
    onZonaChange: cascadeOnZonaChange,
    onPasilloChange: cascadeOnPasilloChange,
    onEstanteChange: cascadeOnEstanteChange,
    loadZonas,
    resetInfraestructuraState,
  } = useInfraestructuraCascade({
    ui,
    form,
    services: {
      getBodegasByCedi: infraestructuraService.getBodegasByCedi,
      getZonasByBodega: infraestructuraService.getZonasByBodega,
      getPasillosByZona: infraestructuraService.getPasillosByZona,
      getEstantesByPasillo: infraestructuraService.getEstantesByPasillo,
      getUbicacionByEstante: infraestructuraService.getUbicacionByEstante,
    },
    keys: {
      idCedi: 'IdCedi',
      idBodega: 'IdBodega',
      idZona: 'IdZona',
      idPasillo: 'IdPasillo',
      idEstante: 'IdEstante',
      idUbicacion: 'IdUbicacion',
    },
    autoSelect: false,
  })

  // Wrappers para limpiar selects hijo cuando cambia el padre
  function onZonaChange(val) {
    form.value.IdPasillo = null
    form.value.IdEstante = null
    form.value.IdUbicacion = null
    cascadeOnZonaChange(val)
  }

  function onPasilloChange(val) {
    form.value.IdEstante = null
    form.value.IdUbicacion = null
    cascadeOnPasilloChange(val)
  }

  function onEstanteChange(val) {
    form.value.IdUbicacion = null
    cascadeOnEstanteChange(val)
  }

  // ─── Validación cantidad ──────────────────────────────────────────────────
  const cantidadRules = computed(() => [
    rules.required,
    rules.numeric,
    (v) => Number(v) > 0 || 'La cantidad debe ser mayor a 0',
    (v) => {
      const pendiente = props.recepcionItem?.CantidadPendiente
      if (!pendiente) return true
      return (
        Number(v) <= Number(pendiente) ||
        `La cantidad no puede ser mayor al pendiente (${pendiente})`
      )
    },
  ])

  // ─── Ciclo de vida del dialog ─────────────────────────────────────────────
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        if (props.readonly && props.recepcionItem) {
          // Modo vista: poblar el form con los datos del ítem de cargue
          form.value = {
            CantidadAsignada: props.recepcionItem.CantidadAsignada ?? null,
            IdZona: props.recepcionItem.IdZona ?? null,
            IdPasillo: props.recepcionItem.IdPasillo ?? null,
            IdEstante: props.recepcionItem.IdEstante ?? null,
            IdUbicacion: props.recepcionItem.IdUbicacion ?? null,
            CodigoZona: props.recepcionItem.CodigoZona ?? '',
            CodigoPasillo: props.recepcionItem.CodigoPasillo ?? '',
            CodigoEstante: props.recepcionItem.CodigoEstante ?? '',
            CodigoUbicacion: props.recepcionItem.CodigoUbicacion ?? '',
            Observaciones: props.recepcionItem.Observaciones ?? '',
          }
        } else {
          form.value = { ...formInitial }
          resetInfraestructuraState({ clearSelections: false })
          if (formRef.value) formRef.value.resetValidation()
          // Cargar zonas de la bodega del acta
          if (props.idBodega) {
            await loadZonas(props.idBodega)
          }
        }
      }
    },
  )

  function existeDuplicado() {
    const codigoProducto = props.recepcionItem?.CodigoProducto
    const codLote = props.recepcionItem?.CodLote
    const idUbicacion = form.value.IdUbicacion

    return props.cargueDetalles.some(
      (d) =>
        d.CodigoProducto === codigoProducto &&
        d.CodLote === codLote &&
        d.IdUbicacion === idUbicacion,
    )
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    if (existeDuplicado()) {
      $toast.error(
        'Este producto y lote ya fueron asignados a esa misma ubicación. Elige otra ubicación o edita la asignación existente.',
      )
      return
    }

    // Resolver nombres de display para mostrar en la tabla
    const zona = zonas.value.find((z) => z.IdZona === form.value.IdZona)
    const pasillo = pasillos.value.find((p) => p.IdPasillo === form.value.IdPasillo)
    const estante = estantes.value.find((e) => e.IdEstante === form.value.IdEstante)
    const ubicacion = ubicaciones.value.find((u) => u.IdUbicacion === form.value.IdUbicacion)

    emit('submit', {
      payload: {
        ...form.value,
        CodigoZona: zona?.CodZona ?? '',
        CodigoPasillo: pasillo?.CodPasillo ?? '',
        CodigoEstante: estante?.CodEstante ?? '',
        CodigoUbicacion: ubicacion?.CodUbicacion ?? '',
      },
      recepcionItem: props.recepcionItem,
    })

    emit('update:modelValue', false)
  }
</script>
<style scoped>
  .product-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background-color: rgba(0, 0, 0, 0.02);
  }

  .product-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background-color: rgba(var(--v-theme-primary), 0.08);
    flex-shrink: 0;
  }

  .section-label {
    display: flex;
    align-items: center;
  }

  .ls-wide {
    letter-spacing: 0.06em;
  }

  .min-w-0 {
    min-width: 0;
  }
</style>
