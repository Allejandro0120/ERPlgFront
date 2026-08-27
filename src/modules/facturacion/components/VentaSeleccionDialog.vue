<template>
  <base-dialog
    color="primary"
    :disable-confirm="!puedeContinuar"
    icon="mdi-file-document-plus-outline"
    label-confirm="Continuar"
    max-width="700"
    :model-value="modelValue"
    :show-actions="true"
    :title="titulo"
    @accept="continuar"
    @update:model-value="onClose"
  >
    <template #content>
      <v-row class="mt-2" density="compact">
        <v-col cols="12">
          <v-autocomplete
            v-model="form.IdCliente"
            item-title="NombreCompleto"
            item-value="IdCliente"
            :items="clientes"
            label="Cliente"
            :loading="loading.clientes"
            no-data-text="No hay clientes disponibles"
            placeholder="Busca por identificación o nombre"
            prepend-inner-icon="mdi-account"
            required
            :rules="[rules.required]"
            variant="outlined"
            @update:model-value="onClienteChange"
          />
        </v-col>

        <v-col cols="12">
          <v-autocomplete
            v-model="form.SucursalKey"
            :filter-keys="sucursalFilterKeys"
            item-title="Etiqueta"
            item-value="Key"
            :items="sucursalesConEtiqueta"
            label="Sucursal"
            :loading="loading.sucursales"
            no-data-text="Selecciona primero un cliente"
            prepend-inner-icon="mdi-store"
            :readonly="!form.IdCliente"
            required
            :rules="[rules.required]"
            variant="outlined"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" density="compact" title="">
                <div class="text-caption font-weight-medium">{{ item.NombreSucursal }}</div>
                <div class="d-flex align-center ga-1 mt-1 text-caption text-grey-darken-1">
                  <v-icon icon="mdi-map-marker-outline" size="10" />
                  {{ item.Direccion }}
                </div>
                <div
                  v-if="item.UbicacionCorta"
                  class="d-flex align-center ga-1 text-caption text-grey"
                >
                  <v-icon icon="mdi-city-variant-outline" size="10" />
                  {{ item.UbicacionCorta }}
                </div>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col cols="12">
          <v-autocomplete
            v-model="form.IdCedi"
            item-title="NombreCedi"
            item-value="IdCedi"
            :items="cedis"
            label="Cedi"
            :loading="loading.cedis"
            no-data-text="No hay centros de distribución disponibles"
            prepend-inner-icon="mdi-warehouse"
            required
            :rules="[rules.required]"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import { clienteService } from '@/api/services/clienteService'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { $toast } from '@/plugins/toast'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    // Título completo del diálogo (el género del artículo depende del documento:
    // "Nueva Cotización" / "Nuevo Pedido"), así que lo decide quien lo usa.
    titulo: { type: String, default: 'Nueva Cotización' },
  })

  const emit = defineEmits(['update:modelValue', 'continue'])

  const formInitial = { IdCliente: null, SucursalKey: null, IdCedi: null }
  const form = ref({ ...formInitial })

  const clientes = ref([])
  const sucursales = ref([])
  const cedis = ref([])
  const loading = reactive({ clientes: false, sucursales: false, cedis: false })

  // Búsqueda del autocomplete de sucursales: nombre, dirección, municipio y departamento
  // (se excluye el centro poblado, que no se muestra en pantalla)
  const sucursalFilterKeys = [
    'raw.NombreSucursal',
    'raw.Direccion',
    'raw.NombreMunicipio',
    'raw.NombreDepartamento',
  ]

  // La sucursal "Principal" llega con IdSucursal null, por lo que se usa una
  // clave de texto para diferenciarla de "sin selección" en el autocomplete.
  const sucursalesConEtiqueta = computed(() =>
    sucursales.value.map((sucursal) => {
      const ubicacionCorta = [sucursal.NombreMunicipio, sucursal.NombreDepartamento]
        .filter(Boolean)
        .join(', ')

      return {
        ...sucursal,
        Key: sucursal.IdSucursal == null ? 'principal' : String(sucursal.IdSucursal),
        UbicacionCorta: ubicacionCorta,
        // Texto mostrado en el campo una vez seleccionada la sucursal
        Etiqueta: [sucursal.NombreSucursal, ubicacionCorta].filter(Boolean).join(' - '),
      }
    }),
  )

  const sucursalSeleccionada = computed(
    () => sucursalesConEtiqueta.value.find((s) => s.Key === form.value.SucursalKey) ?? null,
  )

  const puedeContinuar = computed(
    () => !!(form.value.IdCliente && form.value.SucursalKey && form.value.IdCedi),
  )

  async function cargarClientes() {
    loading.clientes = true
    try {
      const response = await clienteService.getClientesResumen()
      clientes.value = response.data?.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Error al obtener los clientes:', error)
      clientes.value = []
    } finally {
      loading.clientes = false
    }
  }

  async function cargarCedis() {
    loading.cedis = true
    try {
      const response = await infraestructuraService.getCedis()
      cedis.value = response.data?.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Error al obtener los cedis:', error)
      cedis.value = []
    } finally {
      loading.cedis = false
    }
  }

  async function cargarSucursales(idCliente) {
    sucursales.value = []
    if (!idCliente) return
    loading.sucursales = true
    try {
      const response = await clienteService.getSucursalesByCliente(idCliente)
      sucursales.value = response.data?.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Error al obtener las sucursales del cliente:', error)
      sucursales.value = []
    } finally {
      loading.sucursales = false
    }
  }

  function onClienteChange(idCliente) {
    form.value.SucursalKey = null
    cargarSucursales(idCliente)
  }

  function resetForm() {
    form.value = { ...formInitial }
    clientes.value = []
    sucursales.value = []
    cedis.value = []
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      cargarClientes()
      cargarCedis()
    },
  )

  function continuar() {
    if (!puedeContinuar.value) {
      $toast.error('Selecciona cliente, sucursal y cedi para continuar')
      return
    }

    const cliente = clientes.value.find((c) => c.IdCliente === form.value.IdCliente)
    const sucursal = sucursalSeleccionada.value
    const cedi = cedis.value.find((c) => c.IdCedi === form.value.IdCedi)

    emit('continue', { cliente, sucursal, cedi })
    emit('update:modelValue', false)
  }

  function onClose(value) {
    emit('update:modelValue', value)
  }
</script>

<style scoped></style>
