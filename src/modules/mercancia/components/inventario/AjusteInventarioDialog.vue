<template>
  <base-dialog
    v-model="internalValue"
    color="blue-darken-3"
    icon="mdi-package-variant-closed"
    max-width="800"
    title="Realizar Ajuste de Inventario"
    @accept="submit"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row density="compact">
          <!-- Producto -->
          <v-col cols="12" md="8">
            <v-autocomplete
              v-model="formData.producto"
              density="comfortable"
              item-title="nombreCompleto"
              item-value="id"
              :items="productos"
              label="Producto"
              no-filter
              prepend-inner-icon="mdi-magnify"
              readonly
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>

          <!-- Lote -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="formData.lote"
              density="comfortable"
              item-title="nombre"
              item-value="id"
              :items="filteredLotes"
              label="Lote"
              no-filter
              prepend-inner-icon="mdi-barcode-scan"
              readonly
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>

          <!-- Tipo de Ajuste -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.tipoAjuste"
              density="comfortable"
              item-title="Descripcion"
              item-value="IdTipoMovimiento"
              :items="tiposAjuste"
              label="Tipo de ajuste"
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>

          <!-- Cantidad -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.cantidad"
              density="comfortable"
              label="Cantidad"
              prepend-inner-icon="mdi-pound"
              :rules="cantidadRules"
              type="number"
              variant="outlined"
              @keydown="blockKey($event, allow.onlyDigits)"
              @paste="blockPaste($event, allow.onlyDigits)"
            />
          </v-col>

          <!-- Destino Traslado -->
          <template v-if="formData.tipoAjuste === 5">
            <v-col class="pb-0" cols="12">
              <div class="text-subtitle-1 font-weight-medium text-grey-darken-2">
                Ubicación Destino
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdBodega"
                density="comfortable"
                item-title="NombreBodega"
                item-value="IdBodega"
                :items="bodegas"
                label="Bodega"
                :loading="loadingObj.bodegas"
                required
                :rules="[rules.required]"
                variant="outlined"
                @update:model-value="onBodegaChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdZona"
                density="comfortable"
                item-title="CodZona"
                item-value="IdZona"
                :items="zonas"
                label="Zona"
                :loading="loadingObj.zonas"
                required
                :rules="[rules.required]"
                variant="outlined"
                @update:model-value="onZonaChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdPasillo"
                density="comfortable"
                item-title="CodPasillo"
                item-value="IdPasillo"
                :items="pasillos"
                label="Pasillo"
                :loading="loadingObj.pasillos"
                required
                :rules="[rules.required]"
                variant="outlined"
                @update:model-value="onPasilloChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdEstante"
                density="comfortable"
                item-title="CodEstante"
                item-value="IdEstante"
                :items="estantes"
                label="Estante"
                :loading="loadingObj.estantes"
                required
                :rules="[rules.required]"
                variant="outlined"
                @update:model-value="onEstanteChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdUbicacion"
                density="comfortable"
                item-title="CodUbicacion"
                item-value="IdUbicacion"
                :items="ubicaciones"
                label="Ubicación"
                :loading="loadingObj.ubicaciones"
                :rules="ubicacionDestinoRules"
                variant="outlined"
              />
            </v-col>
          </template>

          <!-- Observaciones -->
          <v-col cols="12">
            <v-textarea
              v-model="formData.observaciones"
              counter="400"
              density="comfortable"
              label="Observaciones"
              maxlength="400"
              prepend-inner-icon="mdi-comment-text-outline"
              rows="3"
              :rules="observacionesRules"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions="{ cancel }">
      <v-btn color="grey-darken-1" variant="outlined" @click="cancel">Cerrar</v-btn>
      <v-btn color="primary" :loading="isSubmitting" variant="elevated" @click="submit">
        Guardar
      </v-btn>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { inventarioService } from '@/api/services/inventarioService'
  import { useTiposAjusteInventario } from '@/modules/mercancia/composables/inventario/useTiposAjusteInventario'
  import { $toast } from '@/plugins/toast'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'
  const props = defineProps({
    modelValue: Boolean,
    product: {
      type: Object,
      default: null,
    },
    cedi: {
      type: Number,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'saved'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  })

  const formRef = ref(null)
  const isSubmitting = ref(false)

  const initialForm = {
    tipoAjuste: null,
    producto: null,
    lote: null,
    cantidad: 0,
    observaciones: '',
    IdBodega: null,
    IdZona: null,
    IdPasillo: null,
    IdEstante: null,
    IdUbicacion: null,
  }

  const formData = ref({ ...initialForm })
  const ui = ref({ IdCedi: null })

  const { tiposAjuste, loadTiposAjusteInventario } = useTiposAjusteInventario()

  const cantidadRules = [
    rules.required,
    rules.numeric,
    (v) => Number(v) > 0 || 'La cantidad debe ser mayor a 0',
  ]

  const observacionesRules = computed(() => {
    if (formData.value.tipoAjuste && formData.value.tipoAjuste !== 5) {
      return [rules.required]
    }
    return []
  })

  const ubicacionDestinoRules = computed(() => [
    rules.required,
    (v) =>
      v !== props.product?.IdUbicacion ||
      'La ubicación destino debe ser diferente a la ubicación actual',
  ])

  const {
    bodegas,
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading: loadingObj,
    onCediChange,
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    resetInfraestructuraState,
  } = useInfraestructuraCascade({
    ui,
    form: formData,
    services: infraestructuraService,
    keys: {
      idCedi: 'IdCedi',
      idBodega: 'IdBodega',
      idZona: 'IdZona',
      idPasillo: 'IdPasillo',
      idEstante: 'IdEstante',
      idUbicacion: 'IdUbicacion',
    },
    onError: (error, stage) => {
      console.error(`Error de infraestructura (${stage}):`, error)
      $toast.error('Error al cargar datos de infraestructura')
    },
  })

  const productos = ref([])
  const filteredLotes = ref([])

  onMounted(async () => {
    try {
      await loadTiposAjusteInventario()
    } catch (error) {
      console.error('Error al cargar los tipos de ajuste:', error)
      $toast.error('Error al cargar los tipos de ajuste')
    }
  })

  function initData() {
    formData.value = { ...initialForm }
    ui.value = { IdCedi: props.cedi }
    resetInfraestructuraState()

    if (props.cedi) {
      onCediChange(props.cedi)
    }

    if (props.product) {
      formData.value.producto = props.product.IdProducto
      productos.value = [
        {
          id: props.product.IdProducto,
          nombreCompleto: `${props.product.CodigoProducto || ''} - ${props.product.NombreProducto || ''}`,
        },
      ]

      if (props.product.IdLote) {
        formData.value.lote = props.product.IdLote
        filteredLotes.value = [
          {
            id: props.product.IdLote,
            nombre: props.product.CodLote || `Lote ${props.product.IdLote}`,
          },
        ]
      }
    }

    if (formRef.value) {
      formRef.value.resetValidation()
    }
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) initData()
    },
  )

  async function submit() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.warning('Por favor completa todos los campos requeridos')
      return
    }

    isSubmitting.value = true
    try {
      const payload = {
        IdTipoMovimiento: formData.value.tipoAjuste,
        IdProducto: formData.value.producto,
        IdLote: formData.value.lote,
        Cantidad: formData.value.cantidad,
        Observaciones: formData.value.observaciones,
        IdUbicacionOrigen: props.product?.IdUbicacion,
        IdUbicacionDestino:
          formData.value.tipoAjuste === 5 ? formData.value.IdUbicacion : props.product?.IdUbicacion,
      }

      const response = await inventarioService.realizarAjuste(payload)

      if (response?.data?.success) {
        $toast.success('Ajuste realizado correctamente')
        emit('saved')
        internalValue.value = false
      } else {
        $toast.error(response?.data?.message || 'Error al realizar el ajuste')
      }
    } catch (error) {
      console.error(error)
      $toast.error('Error al realizar el ajuste')
    } finally {
      isSubmitting.value = false
    }
  }
</script>
