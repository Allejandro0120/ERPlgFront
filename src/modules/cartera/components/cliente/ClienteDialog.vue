<template>
  <base-dialog
    color="primary"
    :disable-confirm="isEditing && !hasChanges"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="1300"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <!-- ── Dialog hijo: agregar / editar sucursal ────────────── -->
      <sucursal-form-dialog
        v-model="sucursalDialog.open"
        :departamentos="departamentos"
        :mode="sucursalDialog.mode"
        :sucursal="sucursalDialog.sucursal"
        @submit="onSucursalSubmit"
      />

      <!-- ── Dialog hijo: agregar / editar correo ──────────────── -->
      <correo-form-dialog
        v-model="correoDialog.open"
        :correo="correoDialog.correo"
        :mode="correoDialog.mode"
        :tipos-correos="tiposCorreos"
        @submit="onCorreoSubmit"
      />

      <v-form ref="formRef">
        <!-- ── Tabs ──────────────────────────────────────────────── -->
        <v-tabs v-model="ui.tab" class="mb-6" color="primary">
          <v-tab value="identificacion">
            <v-icon icon="mdi-card-account-details-outline" start />
            Identificación
            <v-badge v-if="tabErrors.identificacion" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="ubicacion">
            <v-icon icon="mdi-map-marker-outline" start />
            Ubicación
            <v-badge v-if="tabErrors.ubicacion" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="comercial">
            <v-icon icon="mdi-tag-outline" start />
            Comercial
            <v-badge v-if="tabErrors.comercial" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="correos">
            <v-icon icon="mdi-email-multiple-outline" start />
            Correos
            <v-chip
              v-if="correos.length > 0"
              class="ml-2"
              color="primary"
              size="x-small"
              variant="tonal"
            >
              {{ correos.length }}
            </v-chip>
          </v-tab>
          <v-tab value="sucursales">
            <v-icon icon="mdi-store-outline" start />
            Sucursales
            <v-chip
              v-if="sucursales.length > 0"
              class="ml-2"
              color="primary"
              size="x-small"
              variant="tonal"
            >
              {{ sucursales.length }}
            </v-chip>
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <!-- ── Tab 1: Identificación ─────────────────────────── -->
          <v-tabs-window-item eager value="identificacion">
            <cliente-identificacion-tab
              :ciuu-con-na="ciuuConNa"
              :estados-catalogo="estadosCatalogo"
              :form="form"
              :is-editing="isEditing"
              :is-readonly="isReadonly"
              :show-estado="isEditing || isReadonly"
              :tipo-identificaciones="tipoIdentificaciones"
            />
          </v-tabs-window-item>

          <!-- ── Tab 2: Ubicación ───────────────────────────────── -->
          <v-tabs-window-item eager value="ubicacion">
            <cliente-ubicacion-tab
              :centros-poblados="centrosPoblados"
              :departamentos="departamentos"
              :form="form"
              :is-readonly="isReadonly"
              :loading-centros-poblados="loadingCentrosPoblados"
              :loading-municipios="loadingMunicipios"
              :municipios="municipios"
              :ui="ui"
              @departamento-change="onDepartamentoChange"
              @municipio-change="onMunicipioChange"
            />
          </v-tabs-window-item>

          <!-- ── Tab 3: Comercial ───────────────────────────────── -->
          <v-tabs-window-item eager value="comercial">
            <cliente-comercial-tab
              :form="form"
              :is-readonly="isReadonly"
              :lista-precios="listaPrecios"
            />
          </v-tabs-window-item>

          <!-- ── Tab 4: Correos ─────────────────────────────────── -->
          <v-tabs-window-item eager value="correos">
            <cliente-correos-tab
              :correos="correos"
              :headers="correosHeaders"
              :is-readonly="isReadonly"
              :row-actions="correoRowActions"
              :tipos-correos="tiposCorreos"
              @add="abrirAgregarCorreo"
            />
          </v-tabs-window-item>

          <!-- ── Tab 5: Sucursales ──────────────────────────────── -->
          <v-tabs-window-item eager value="sucursales">
            <cliente-sucursales-tab
              :headers="sucursalesHeaders"
              :is-readonly="isReadonly"
              :row-actions="sucursalRowActions"
              :sucursales="sucursales"
              @add="abrirAgregarSucursal"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { globalService } from '@/api/services/globalService'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import { useUbicacionCascade } from '@/shared/composables/useUbicacionCascade'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { formatCOP, parseCOP } from '@/shared/utils/currencyFormatter'
  import { useClienteCatalogos } from '../../composables/cliente/useClienteCatalogos'
  import { useClienteCorreos } from '../../composables/cliente/useClienteCorreos'
  import { useClienteSucursales } from '../../composables/cliente/useClienteSucursales'
  import CorreoFormDialog from './CorreoFormDialog.vue'
  import SucursalFormDialog from './SucursalFormDialog.vue'
  import ClienteComercialTab from './tabs/ClienteComercialTab.vue'
  import ClienteCorreosTab from './tabs/ClienteCorreosTab.vue'
  import ClienteIdentificacionTab from './tabs/ClienteIdentificacionTab.vue'
  import ClienteSucursalesTab from './tabs/ClienteSucursalesTab.vue'
  import ClienteUbicacionTab from './tabs/ClienteUbicacionTab.vue'

  // ─── Props & Emits ────────────────────────────────────────────────────────────
  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    cliente: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  // ─── Computed modo ────────────────────────────────────────────────────────────
  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const clienteDisplayName = computed(() => {
    const nombre = props.cliente?.Nombre?.trim()
    if (nombre) return nombre
    if (props.cliente?.NumeroIdentificacion) return props.cliente.NumeroIdentificacion
    if (props.cliente?.IdCliente) return `#${props.cliente.IdCliente}`
    return ''
  })

  const dialogTitle = computed(() => {
    const baseTitle =
      {
        create: 'Crear Cliente',
        edit: 'Editar Cliente',
        view: 'Detalle del Cliente',
      }[props.mode] || 'Cliente'

    if (props.mode === 'create' || !clienteDisplayName.value) {
      return baseTitle
    }

    return `${baseTitle}: ${clienteDisplayName.value}`
  })
  const dialogIcon = computed(
    () =>
      ({
        create: 'mdi-account-plus',
        edit: 'mdi-account-edit',
        view: 'mdi-card-account-details-outline',
      })[props.mode],
  )
  const labelConfirm = computed(
    () => ({ create: 'Crear Cliente', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  // ─── Estado global ────────────────────────────────────────────────────────────
  const formRef = ref(null)
  const {
    tipoIdentificaciones,
    listaPrecios,
    departamentos,
    estadosCatalogo,
    tiposCorreos,
    ciuuConNa,
    cargarCatalogos,
    setCatalogosLectura,
  } = useClienteCatalogos()

  const {
    sucursales,
    sucursalDialog,
    sucursalesHeaders,
    sucursalRowActions,
    abrirAgregarSucursal,
    onSucursalSubmit,
    hydrateSucursales,
    setSucursalesSnapshot,
    resetSucursales,
    hasSucursalesChanges,
    getSucursalesChanges,
  } = useClienteSucursales({ isReadonly })

  const {
    correos,
    correoDialog,
    correosHeaders,
    correoRowActions,
    abrirAgregarCorreo,
    onCorreoSubmit,
    hydrateCorreos,
    setCorreosSnapshot,
    resetCorreos,
    hasCorreosChanges,
    getCorreosChanges,
  } = useClienteCorreos({ isReadonly })

  // ─── Form principal ───────────────────────────────────────────────────────────
  const formInitial = {
    IdTipoIdentificacion: null,
    NumeroIdentificacion: '',
    Nombre: '',
    CorreoGeneral: '',
    Telefono: '',
    IdListaPrecio: null,
    Plazo: null,
    CupoCredito: null,
    Direccion: '',
    IdCiiu: null,
    IdCentroPoblado: null,
    Estado: null,
  }
  const uiInitial = {
    tab: 'identificacion',
    idDepartamento: null,
    idMunicipio: null,
  }

  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })
  const formSnapshot = ref(null)

  const {
    municipios,
    centrosPoblados,
    loadingMunicipios,
    loadingCentrosPoblados,
    onDepartamentoChange,
    onMunicipioChange,
    preloadLocation,
    setLocationDataLectura,
    resetLocationState,
  } = useUbicacionCascade({
    ui,
    form,
    fetchMunicipios: globalService.getMunicipiosByDepartamento,
    fetchCentrosPoblados: globalService.getCentrosPobladosByMunicipio,
  })

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    const formChanged = hasObjectChanges(form.value, formSnapshot.value)
    const sucChanged = hasSucursalesChanges()
    const correosChanged = hasCorreosChanges()
    return formChanged || sucChanged || correosChanged
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
  })

  // ─── Tab errors ───────────────────────────────────────────────────────────────
  const campoATab = {
    IdTipoIdentificacion: 'identificacion',
    NumeroIdentificacion: 'identificacion',
    Nombre: 'identificacion',
    CorreoGeneral: 'identificacion',
    Telefono: 'identificacion',
    Estado: 'identificacion',
    IdCiiu: 'identificacion',
    idDepartamento: 'ubicacion',
    idMunicipio: 'ubicacion',
    IdCentroPoblado: 'ubicacion',
    Direccion: 'ubicacion',
    IdListaPrecio: 'comercial',
    Plazo: 'comercial',
    CupoCredito: 'comercial',
  }

  const tabErrors = computed(() => {
    const result = { identificacion: false, ubicacion: false, comercial: false }
    if (!formRef.value) return result
    for (const { id } of formRef.value.errors ?? []) {
      const tab = campoATab[id]
      if (tab) result[tab] = true
    }
    return result
  })

  // ─── Precarga del cliente ─────────────────────────────────────────────────────
  async function precargarCliente(cliente) {
    if (isReadonly.value) {
      setLocationDataLectura(cliente)
    } else {
      await preloadLocation({
        idDepartamento: cliente.IdDepartamento ?? null,
        idMunicipio: cliente.IdMunicipio ?? null,
        idCentroPoblado: cliente.IdCentroPoblado ?? null,
      })
    }

    form.value = {
      IdTipoIdentificacion: cliente.IdTipoIdentificacion,
      NumeroIdentificacion: cliente.NumeroIdentificacion,
      Nombre: cliente.Nombre,
      CorreoGeneral: cliente.CorreoGeneral,
      Telefono: cliente.Telefono,
      IdListaPrecio: cliente.IdListaPrecio,
      Plazo: cliente.Plazo == null ? '' : String(cliente.Plazo),
      CupoCredito: formatCOP(cliente.CupoCredito),
      Direccion: cliente.Direccion,
      IdCiiu: cliente.IdCiiu,
      IdCentroPoblado: cliente.IdCentroPoblado,
      Estado: cliente.IdEstado,
    }

    hydrateSucursales(cliente.sucursales || [])
    hydrateCorreos(cliente.correos || [])

    formSnapshot.value = { ...form.value }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────────
  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    resetLocationState()
    resetSucursales()
    resetCorreos()
    formSnapshot.value = null
    formRef.value?.resetValidation()
  }

  // ─── Watch apertura ───────────────────────────────────────────────────────────

  async function inicializarModoLectura() {
    setCatalogosLectura(props.cliente)
    await precargarCliente(props.cliente)
  }

  async function inicializarModoEdicion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
    await precargarCliente(props.cliente)
  }

  async function inicializarModoCreacion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
    formSnapshot.value = { ...form.value }
    setSucursalesSnapshot([])
    setCorreosSnapshot([])
  }

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      $loading.show()
      try {
        if (isReadonly.value && props.cliente) await inicializarModoLectura()
        else if (isCreating.value) await inicializarModoCreacion()
        else await inicializarModoEdicion()
      } catch (error) {
        console.error('Error al inicializar diálogo:', error)
      } finally {
        $loading.hide()
      }
    },
  )

  // ─── Submit ───────────────────────────────────────────────────────────────────
  async function submitForm() {
    const { valid } = await formRef.value.validate()

    if (!valid) {
      const primerTabConError = Object.keys(tabErrors.value).find((k) => tabErrors.value[k])
      if (primerTabConError) ui.value.tab = primerTabConError
      $toast.error('Por favor corrige los errores en los campos marcados')
      return
    }

    const confirmado = await $confirm.confirm({
      title: isCreating.value ? '¿Crear cliente?' : '¿Guardar cambios?',
      message: isCreating.value
        ? 'Se registrará un nuevo cliente con los datos ingresados.'
        : `Se actualizará la información de <strong>${form.value.Nombre}</strong>.`,
      labelConfirm: isCreating.value ? 'Sí, crear' : 'Sí, guardar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    const changes = getChangedFields(form.value, formSnapshot.value, {
      normalizers: {
        CupoCredito: parseCOP,
        Plazo: (v) => (v !== null && v !== '' ? Number.parseInt(v, 10) : null),
      },
    })

    const sucursalesCambios = getSucursalesChanges()
    if (sucursalesCambios.length > 0) {
      changes.sucursales = sucursalesCambios
    }

    const correosCambios = getCorreosChanges()
    if (correosCambios !== null) {
      changes.correos = correosCambios
    }

    emit('submit', { payload: changes, mode: props.mode })
  }
</script>

<style scoped></style>
