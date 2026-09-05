<template>
  <base-dialog
    color="primary"
    :disable-confirm="isEditing && !hasChanges"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="800"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef">
        <v-row class="mt-1">
          <!-- Nombre -->
          <v-col cols="12">
            <v-text-field
              v-model="form.NombreSucursal"
              :clearable="!isReadonly"
              label="Nombre de la Sucursal"
              name="NombreSucursal"
              prepend-inner-icon="mdi-store-outline"
              :readonly="isReadonly"
              required
              :rules="[rules.required]"
            />
          </v-col>

          <!-- Teléfono -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.Telefono"
              :clearable="!isReadonly"
              label="Teléfono"
              maxlength="15"
              name="Telefono"
              prepend-inner-icon="mdi-phone-outline"
              :readonly="isReadonly"
              required
              :rules="[
                rules.required,
                rules.numeric,
                rules.minLength(6, 'El teléfono'),
                rules.maxLength(15, 'El teléfono'),
              ]"
              @keydown="blockKey($event, allow.onlyDigits)"
              @paste="blockPaste($event, allow.onlyDigits)"
            />
          </v-col>

          <!-- Correo -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.CorreoGeneral"
              :clearable="!isReadonly"
              label="Correo Electrónico"
              name="CorreoGeneral"
              prepend-inner-icon="mdi-email-outline"
              :readonly="isReadonly"
              required
              :rules="[rules.required, rules.email]"
              type="email"
            />
          </v-col>

          <!-- Departamento -->
          <v-col cols="12">
            <v-autocomplete
              v-model="ui.idDepartamento"
              :clearable="!isReadonly"
              item-title="NombreDepartamento"
              item-value="IdDepartamento"
              :items="departamentos"
              label="Departamento"
              name="idDepartamento"
              prepend-inner-icon="mdi-map-outline"
              :readonly="isReadonly"
              required
              :rules="[rules.required]"
              @update:model-value="onDepartamentoChange"
            />
          </v-col>

          <!-- Municipio -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="ui.idMunicipio"
              :clearable="!isReadonly"
              :disabled="!ui.idDepartamento"
              item-title="NombreMunicipio"
              item-value="IdMunicipio"
              :items="municipios"
              label="Municipio"
              :loading="loadingMunicipios"
              name="idMunicipio"
              prepend-inner-icon="mdi-city-variant-outline"
              :readonly="isReadonly"
              required
              :rules="[rules.required]"
              @update:model-value="onMunicipioChange"
            />
          </v-col>

          <!-- Centro Poblado -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="form.IdCentroPoblado"
              :clearable="!isReadonly"
              :disabled="!ui.idMunicipio"
              item-title="NombreCentroPoblado"
              item-value="IdCentroPoblado"
              :items="centrosPoblados"
              label="Centro Poblado"
              :loading="loadingCentrosPoblados"
              name="IdCentroPoblado"
              prepend-inner-icon="mdi-home-group"
              :readonly="isReadonly"
              required
              :rules="[rules.required]"
            />
          </v-col>

          <!-- Dirección -->
          <v-col cols="12">
            <v-text-field
              v-model="form.Direccion"
              :clearable="!isReadonly"
              label="Dirección"
              maxlength="255"
              name="Direccion"
              prepend-inner-icon="mdi-map-marker-outline"
              :readonly="isReadonly"
              required
              :rules="[rules.required, rules.minLength(4, 'La dirección')]"
            />
          </v-col>
          <!-- Estado (solo edición / vista) -->
          <v-col v-if="isEditing || isReadonly" cols="12" sm="6">
            <v-select
              v-model="form.Habilitada"
              item-title="label"
              item-value="value"
              :items="opcionesEstado"
              label="Estado"
              name="Habilitada"
              prepend-inner-icon="mdi-domain"
              :readonly="isReadonly"
            >
              <template #selection="{ item }">
                <v-chip class="estado-chip" :color="item.color" label variant="tonal">
                  <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
                  {{ item.label }}
                </v-chip>
              </template>

              <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps" title="">
                  <v-chip :color="item.color" label variant="tonal">
                    <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
                    {{ item.label }}
                  </v-chip>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>
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
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import { useUbicacionCascade } from '@/shared/composables/useUbicacionCascade'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  // ─── Props & Emits ────────────────────────────────────────────────────────────
  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    sucursal: {
      type: Object,
      default: null,
    },
    departamentos: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  // ─── Computed modo ────────────────────────────────────────────────────────────
  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')

  const dialogTitle = computed(
    () =>
      ({
        create: 'Agregar Sucursal',
        edit: 'Editar Sucursal',
        view: 'Detalle de Sucursal',
      })[props.mode],
  )
  const dialogIcon = computed(
    () =>
      ({
        create: 'mdi-store-plus-outline',
        edit: 'mdi-store-edit-outline',
        view: 'mdi-store-outline',
      })[props.mode],
  )
  const labelConfirm = computed(
    () => ({ create: 'Agregar Sucursal', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  // ─── Estado ───────────────────────────────────────────────────────────────────
  const formRef = ref(null)

  const opcionesEstado = computed(() =>
    [
      { label: 'Habilitada', value: true },
      { label: 'Deshabilitada', value: false },
    ].map((op) => ({
      ...op,
      color: getEstadoColor(op.value, DOMINIOS_ESTADO.SUCURSAL),
    })),
  )
  const formInitial = {
    NombreSucursal: '',
    Telefono: '',
    CorreoGeneral: '',
    Direccion: '',
    IdCentroPoblado: null,
    Habilitada: true,
  }

  const uiInitial = {
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
    onError: (error, stage) => {
      console.error(`Error en sucursal (${stage}):`, error)
    },
  })

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    return JSON.stringify(form.value) !== JSON.stringify(formSnapshot.value)
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes cambios sin guardar en la sucursal. ¿Deseas salir de todas formas?',
  })

  // ─── Precarga al editar/ver ───────────────────────────────────────────────────
  async function precargarSucursal(suc) {
    if (isReadonly.value) {
      setLocationDataLectura(suc)
    } else {
      await preloadLocation({
        idDepartamento: suc.IdDepartamento ?? null,
        idMunicipio: suc.IdMunicipio ?? null,
        idCentroPoblado: suc.IdCentroPoblado ?? null,
      })
    }

    form.value = {
      NombreSucursal: suc.NombreSucursal ?? '',
      Telefono: suc.Telefono ?? '',
      CorreoGeneral: suc.CorreoGeneral ?? '',
      Direccion: suc.Direccion ?? '',
      IdCentroPoblado: suc.IdCentroPoblado ?? null,
      Habilitada: suc.Habilitada ?? true,
    }

    formSnapshot.value = { ...form.value }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────────
  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    resetLocationState()
    formSnapshot.value = null
    formRef.value?.resetValidation()
  }

  // ─── Watch apertura ───────────────────────────────────────────────────────────
  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }

      if (props.sucursal && props.mode !== 'create') {
        $loading.show()
        try {
          await precargarSucursal(props.sucursal)
        } finally {
          $loading.hide()
        }
      } else {
        formSnapshot.value = { ...form.value }
      }
    },
  )

  // ─── Submit ───────────────────────────────────────────────────────────────────
  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    // Solo pasamos lo que el padre necesita para construir el objeto local.
    const payload = {
      ...form.value,
      ...(props.sucursal?.IdSucursal ? { IdSucursal: props.sucursal.IdSucursal } : {}),
      IdDepartamento: ui.value.idDepartamento,
      IdMunicipio: ui.value.idMunicipio,
      NombreDepartamento:
        props.departamentos?.find((d) => d.IdDepartamento === ui.value.idDepartamento)
          ?.NombreDepartamento ?? null,
      NombreMunicipio:
        municipios.value.find((m) => m.IdMunicipio === ui.value.idMunicipio)?.NombreMunicipio ??
        null,
      NombreCentroPoblado:
        centrosPoblados.value.find((c) => c.IdCentroPoblado === form.value.IdCentroPoblado)
          ?.NombreCentroPoblado ?? null,
    }

    emit('submit', { payload, mode: props.mode })
  }
</script>
