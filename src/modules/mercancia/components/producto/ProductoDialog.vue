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
      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="general">
            <v-icon icon="mdi-file" start />
            General
            <v-badge v-if="tabErrors.general" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="farmaceutica">
            <v-icon icon="mdi-pill" start />
            Farmacéutica
            <v-badge v-if="tabErrors.farmaceutica" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="comercial">
            <v-icon icon="mdi-domain" start />
            Comercial
            <v-badge v-if="tabErrors.comercial" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="regulacion">
            <v-icon icon="mdi-shield-check" start />
            Regulación
            <v-badge v-if="tabErrors.regulacion" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="lotes">
            <v-icon icon="mdi-package-variant" start />
            Lotes
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="general">
            <producto-general-tab :form="form" :is-readonly="isReadonly" />
          </v-tabs-window-item>
          <v-tabs-window-item eager value="farmaceutica">
            <producto-farmaceutica-tab
              :concentraciones="concentraciones"
              :form="form"
              :formas-farmaceuticas="formasFarmaceuticas"
              :is-readonly="isReadonly"
              :laboratorios="laboratorios"
              :moleculas="moleculas"
              @reload-concentracion="cargarConcentraciones"
              @reload-forma-farmaceutica="cargarFormasFarmaceuticas"
              @reload-laboratorio="cargarLaboratorios"
              @reload-molecula="cargarMoleculas"
            />
          </v-tabs-window-item>
          <v-tabs-window-item eager value="comercial">
            <producto-comercial-tab
              :form="form"
              :is-readonly="isReadonly"
              :presentaciones="presentaciones"
              :tarifas-i-v-a="tarifasIVA"
              @reload-presentacion="cargarPresentaciones"
              @reload-tarifa-iva="cargarTarifasIva"
            />
          </v-tabs-window-item>
          <v-tabs-window-item eager value="regulacion">
            <producto-regulacion-tab :form="form" :is-readonly="isReadonly" />
          </v-tabs-window-item>
          <v-tabs-window-item eager value="lotes">
            <producto-lotes-tab
              :headers="lotesHeaders"
              :is-readonly="isReadonly"
              :lotes="lotes"
              @add="abrirAgregarLote"
              @toggle-activo="({ localId, activo }) => toggleLoteActivo(localId, activo)"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>

  <lote-form-dialog v-model="loteDialog.open" @submit="onLoteSubmit" />
</template>
<script setup>
  import { computed, ref, watch } from 'vue'
  import { useProductoCatalogos } from '@/modules/mercancia/composables/producto/useProductoCatalogos'
  import { useProductoLotes } from '@/modules/mercancia/composables/producto/useProductoLotes'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { formatCOP, parseCOP } from '@/shared/utils/currencyFormatter'
  import LoteFormDialog from './creacion/LoteFormDialog.vue'
  import ProductoComercialTab from './tabs/ProductoComercialTab.vue'
  import ProductoFarmaceuticaTab from './tabs/ProductoFarmaceuticaTab.vue'
  import ProductoGeneralTab from './tabs/ProductoGeneralTab.vue'
  import ProductoLotesTab from './tabs/ProductoLotesTab.vue'
  import ProductoRegulacionTab from './tabs/ProductoRegulacionTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'view', 'edit'].includes(v),
    },
    producto: { type: Object, default: null },
  })
  const emit = defineEmits(['update:modelValue', 'submit'])
  const formRef = ref(null)
  const formSnapshot = ref(null)

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const productoDisplayName = computed(() => props.producto?.Nombre ?? '')

  const dialogTitle = computed(() => {
    const base =
      { create: 'Crear Producto', edit: 'Editar Producto', view: 'Detalle del Producto' }[
        props.mode
      ] ?? 'Producto'
    return props.mode === 'create' || !productoDisplayName.value
      ? base
      : `${base}: ${productoDisplayName.value}`
  })

  const dialogIcon = computed(
    () => ({ create: 'mdi-file-plus', edit: 'mdi-file-edit', view: 'mdi-file-eye' })[props.mode],
  )

  const labelConfirm = computed(
    () => ({ create: 'Crear Producto', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const {
    concentraciones,
    formasFarmaceuticas,
    moleculas,
    laboratorios,
    presentaciones,
    tarifasIVA,
    cargarCatalogos,
    setCatalogosLectura,
    cargarLaboratorios,
    cargarMoleculas,
    cargarConcentraciones,
    cargarFormasFarmaceuticas,
    cargarPresentaciones,
    cargarTarifasIva,
  } = useProductoCatalogos()

  const {
    lotes,
    loteDialog,
    lotesHeaders,
    abrirAgregarLote,
    onLoteSubmit,
    toggleLoteActivo,
    hydrateLotes,
    resetLotes,
    hasLotesChanges,
    getLotesChanges,
  } = useProductoLotes()

  const formInitial = {
    CodigoProducto: '',
    Nombre: '',
    NombreComercial: '',
    CodigoBarras: '',
    CUM: '',
    ATC: '',
    Invima: '',
    VigenciaInvima: '',
    FactorConversion: null,
    CantidadEmbalaje: null,
    HabilitadoCompras: false,
    HabilitadoVentas: false,
    Regulado: false,
    ValorTopeRegulado: null,
    ResolucionRegulado: '',
    CadenaFrio: false,
    Controlado: false,
    Activo: true,
    IdPresentacion: null,
    IdConcentracion: null,
    IdFormaFarmaceutica: null,
    IdLaboratorio: null,
    IdMolecula: null,
    IdTarifaIVA: null,
  }

  const campoATab = {
    CodigoProducto: 'general',
    CodigoBarras: 'general',
    IdMolecula: 'farmaceutica',
    IdConcentracion: 'farmaceutica',
    IdFormaFarmaceutica: 'farmaceutica',
    IdLaboratorio: 'farmaceutica',
    FactorConversion: 'comercial',
    CantidadEmbalaje: 'comercial',
    IdPresentacion: 'comercial',
    IdTarifaIVA: 'comercial',
    CUM: 'regulacion',
    ATC: 'regulacion',
    Invima: 'regulacion',
    VigenciaInvima: 'regulacion',
    ValorTopeRegulado: 'regulacion',
    ResolucionRegulado: 'regulacion',
  }

  const tabErrors = computed(() => {
    const result = { general: false, farmaceutica: false, comercial: false, regulacion: false }
    if (!formRef.value) return result
    for (const { id } of formRef.value.errors ?? []) {
      const tab = campoATab[id]
      if (tab) result[tab] = true
    }
    return result
  })
  const form = ref({ ...formInitial })

  const ui = ref({ tab: 'general' })

  async function precargarProducto(producto) {
    if (!producto) return
    form.value = {
      ...formInitial,
      ...producto,
      // Extraer los IDs de los objetos anidados
      IdMolecula: producto.Molecula?.IdMolecula ?? null,
      IdConcentracion: producto.Concentracion?.IdConcentracion ?? null,
      IdFormaFarmaceutica: producto.FormaFarmaceutica?.IdFormaFarmaceutica ?? null,
      IdLaboratorio: producto.Laboratorio?.IdLaboratorio ?? null,
      IdPresentacion: producto.Presentacion?.IdPresentacion ?? null,
      IdTarifaIVA: producto.TarifaIVA?.IdTarifaIVA ?? null,
      ValorTopeRegulado: formatCOP(producto.ValorTopeRegulado),
    }
    hydrateLotes(producto.Lotes)
    formSnapshot.value = { ...form.value }
  }
  async function inicializarModoLectura() {
    setCatalogosLectura(props.producto)
    await precargarProducto(props.producto)
  }

  async function inicializarModoCreacion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
    formSnapshot.value = { ...form.value }
  }

  async function inicializarModoEdicion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
    await precargarProducto(props.producto)
  }

  // Helpers para buscar el nombre visible en cada catálogo por Id
  function buscarNombre(lista, id, campoId, campoNombre) {
    if (!id) return ''
    const item = lista.value?.find((x) => x[campoId] === id)
    return item?.[campoNombre] ?? ''
  }

  const nombreProductoAuto = computed(() => {
    const molecula = buscarNombre(moleculas, form.value.IdMolecula, 'IdMolecula', 'Nombre')
    const concentracion = buscarNombre(
      concentraciones,
      form.value.IdConcentracion,
      'IdConcentracion',
      'Descripcion',
    )
    const formaFarmaceutica = buscarNombre(
      formasFarmaceuticas,
      form.value.IdFormaFarmaceutica,
      'IdFormaFarmaceutica',
      'Nombre',
    )
    const laboratorio = buscarNombre(
      laboratorios,
      form.value.IdLaboratorio,
      'IdLaboratorio',
      'Nombre',
    )
    const nombreComercial = form.value.NombreComercial?.trim()

    if (!molecula && !concentracion && !formaFarmaceutica) return ''

    let nombre = [molecula, concentracion, formaFarmaceutica].filter(Boolean).join(' * ')
    if (nombreComercial) nombre += ` (${nombreComercial})`
    if (laboratorio) nombre += ` - ${laboratorio}`
    return nombre
  })

  watch(nombreProductoAuto, (nuevoNombre) => {
    if (!isReadonly.value) {
      form.value.Nombre = nuevoNombre
    }
  })

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      $loading.show()
      try {
        if (isReadonly.value && props.producto) await inicializarModoLectura()
        else if (isCreating.value) await inicializarModoCreacion()
        else await inicializarModoEdicion()
      } catch (error) {
        console.error('Error al inicializar diálogo:', error)
      } finally {
        $loading.hide()
      }
    },
  )

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    const formChanged = hasObjectChanges(form.value, formSnapshot.value)
    return formChanged || hasLotesChanges()
  })
  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
  })

  function resetForm() {
    form.value = { ...formInitial }
    ui.value.tab = 'general'
    resetLotes()
    formRef.value?.resetValidation()
  }
  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      const primerTabConError = Object.keys(tabErrors.value).find((k) => tabErrors.value[k])
      if (primerTabConError) ui.value.tab = primerTabConError
      $toast.error('Por favor corrige los errores en los campos marcados')
      return
    }
    const confirmado = await $confirm.confirm({
      title: isCreating.value ? '¿Crear producto?' : '¿Guardar cambios?',
      message: isCreating.value
        ? 'Se registrará un nuevo producto con los datos ingresados.'
        : `Se actualizará la información de <strong>${form.value.Nombre}</strong>.`,
      labelConfirm: isCreating.value ? 'Sí, crear' : 'Sí, guardar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return
    const changes = getChangedFields(form.value, formSnapshot.value, {
      normalizers: {
        ValorTopeRegulado: parseCOP,
      },
    })
    const lotesChanges = getLotesChanges()
    const payload = lotesChanges ? { ...changes, Lotes: lotesChanges } : changes

    emit('submit', { payload, mode: props.mode })
  }
</script>
