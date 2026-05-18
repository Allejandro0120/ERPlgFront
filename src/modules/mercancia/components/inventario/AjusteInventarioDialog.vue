<template>
  <base-dialog
    v-model="internalValue"
    max-width="800"
    title="Realizar Ajuste de Inventario"
    icon="mdi-package-variant-closed"
    color="blue-darken-3"
  >
    <template #content>
      <v-form ref="formRef" v-model="isFormValid" class="pa-4 pt-4" @submit.prevent="submit">
        <v-row>
          <!-- Tipo de Ajuste -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.tipoAjuste"
              :items="tiposAjuste"
              item-title="nombre"
              item-value="id"
              label="Tipo de ajuste"
              variant="outlined"
              density="comfortable"
              :rules="requiredRules"
              required
            ></v-autocomplete>
          </v-col>

          <!-- Ubicación Origen -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.ubicacionOrigen"
              :items="ubicacionesOrigen"
              item-title="nombre"
              item-value="id"
              label="Ubicación origen"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-marker"
              :rules="requiredRules"
              @update:search="fetchUbicacionesOrigen"
              no-filter
              required
            ></v-autocomplete>
          </v-col>

          <!-- Producto -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.producto"
              :items="productos"
              item-title="nombreCompleto"
              item-value="id"
              label="Producto"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-magnify"
              :rules="requiredRules"
              @update:search="fetchProductos"
              no-filter
              required
              :disabled="true"
            ></v-autocomplete>
          </v-col>

          <!-- Lote -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.lote"
              :items="filteredLotes"
              item-title="nombre"
              item-value="id"
              label="Lote"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-barcode-scan"
              :rules="requiredRules"
              @update:search="fetchLotes"
              no-filter
              required
            ></v-autocomplete>
          </v-col>

          <!-- Ubicación Destino (Opcional) -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="formData.ubicacionDestino"
              :items="ubicacionesDestino"
              item-title="nombre"
              item-value="id"
              label="Ubicación Destino"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-arrow-down-circle-outline"
              @update:search="fetchUbicacionesDestino"
              no-filter
            ></v-autocomplete>
          </v-col>

          <!-- Cantidad -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="formData.cantidad"
              label="Cantidad"
              type="number"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-pound"
              :rules="cantidadRules"
              required
            ></v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions="{ cancel }">
      <v-btn variant="outlined" color="grey-darken-1" @click="cancel"> Cerrar </v-btn>
      <v-btn color="primary" variant="elevated" :loading="isSubmitting" @click="submit">
        Guardar
      </v-btn>
    </template>
  </base-dialog>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { $toast } from '@/plugins/toast'

  const props = defineProps({
    modelValue: Boolean,
    product: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'saved'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  })

  const formRef = ref(null)
  const isFormValid = ref(false)
  const isSubmitting = ref(false)

  const initialForm = {
    tipoAjuste: null,
    ubicacionOrigen: null,
    producto: null,
    lote: null,
    ubicacionDestino: null,
    cantidad: 0,
  }

  const formData = ref({ ...initialForm })

  // Reglas de validación
  const requiredRules = [(v) => !!v || 'Este campo es requerido']
  const cantidadRules = [...requiredRules, (v) => v > 0 || 'La cantidad debe ser mayor a 0']

  // Mock de Tipos de Ajuste (preparado para API)
  const tiposAjuste = ref([
    { id: 1, nombre: 'Ajuste positivo' },
    { id: 2, nombre: 'Ajuste negativo' },
  ])

  // Productos - mock / Inicializado con el producto de props
  const productos = ref([])
  // Lotes - mock
  const lotes = ref([])
  const filteredLotes = ref([])
  // Ubicaciones
  const ubicacionesOrigen = ref([])
  const ubicacionesDestino = ref([])

  // Mock methods prepared for integration (at least 3 characters)
  const fetchProductos = async (search) => {
    if (!search || search.length < 3) {
      productos.value = props.product
        ? [
            {
              id: props.product.IdProducto,
              nombreCompleto: `${props.product.CodigoProducto || 'N/A'} - ${props.product.NombreProducto || 'Nombre'}`,
            },
          ]
        : []
      return
    }
    // TODO: Call API
  }

  const fetchLotes = async (search) => {
    if (!search || search.length < 3) {
      filteredLotes.value = []
      return
    }
    // TODO: Call API, for now mock
    filteredLotes.value = [
      { id: 1, nombre: 'Lote 001' },
      { id: 2, nombre: 'Lote 002' },
      { id: 3, nombre: 'Lote XYZ' },
    ].filter((l) => l.nombre.toLowerCase().includes(search.toLowerCase()))
  }

  const fetchUbicacionesOrigen = async (search) => {
    if (!search || search.length < 3) return
    // TODO: API Call
    ubicacionesOrigen.value = [
      { id: 1, nombre: 'UB01-CENTRAL' },
      { id: 2, nombre: 'UB02-PHARMA' },
    ]
  }

  const fetchUbicacionesDestino = async (search) => {
    if (!search || search.length < 3) return
    // TODO: API Call
    ubicacionesDestino.value = [
      { id: 1, nombre: 'UB01-CENTRAL' },
      { id: 2, nombre: 'UB02-PHARMA' },
    ]
  }

  const initData = () => {
    formData.value = { ...initialForm }

    if (props.product) {
      formData.value.producto = props.product.IdProducto
      productos.value = [
        {
          id: props.product.IdProducto,
          nombreCompleto: `${props.product.CodigoProducto || ''} - ${props.product.NombreProducto || ''}`,
        },
      ]

      // Si viene ubicación del producto
      if (props.product.IdUbicacion) {
        formData.value.ubicacionOrigen = props.product.IdUbicacion
        ubicacionesOrigen.value = [
          {
            id: props.product.IdUbicacion,
            nombre: props.product.Ubicacion || `Ubicación ${props.product.IdUbicacion}`,
          },
        ]
      }

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
      if (isOpen) {
        initData()
      }
    },
  )

  const submit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    isSubmitting.value = true
    try {
      // TODO: Emit to parent or call API
      // await mercanciaService.realizarAjuste(formData.value)

      // Simulating delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      $toast.success('Ajuste realizado correctamente')
      emit('saved')
      internalValue.value = false
    } catch (error) {
      console.error(error)
      $toast.error('Error al realizar el ajuste')
    } finally {
      isSubmitting.value = false
    }
  }
</script>
