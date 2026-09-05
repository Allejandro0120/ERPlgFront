<template>
  <base-dialog
    color="primary"
    :disable-confirm="!archivo"
    icon="mdi-file-excel-outline"
    label-confirm="Actualizar"
    max-width="600"
    :model-value="modelValue"
    title="Actualización Masiva de Productos"
    @accept="submitForm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <v-form ref="formRef">
        <v-card class="plantilla-card px-4 py-3 mb-5" flat rounded="lg">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center ga-3" style="flex: 1 1 220px; min-width: 0">
              <div class="plantilla-icon-wrap">
                <v-icon color="primary" icon="mdi-file-table-outline" size="20" />
              </div>
              <div style="min-width: 0">
                <div class="text-body-medium text-brand-grey-1 font-weight-semibold">
                  Plantilla oficial
                </div>
                <div class="text-body-medium text-brand-grey-2 font-weight-medium">
                  Descárgala, complétala y súbela para actualizar la lista
                </div>
              </div>
            </div>

            <v-btn
              color="primary"
              :loading="descargandoPlantilla"
              prepend-icon="mdi-download"
              variant="tonal"
              @click="descargarPlantilla"
            >
              Descargar
            </v-btn>
          </div>
        </v-card>

        <v-file-upload
          v-model="archivo"
          class="excel-dropzone"
          filter-by-type=".xlsx,.xls"
          icon=""
          :rules="[(v) => !!v || 'Debes seleccionar un archivo Excel']"
          subtitle="Archivos .xlsx o .xls · máx. 15 MB"
          title="Arrastra aquí el archivo Excel"
          @rejected="onArchivoRechazado"
        >
          <template #item="{ file, props: itemProps }">
            <v-file-upload-item clearable :file="file" show-size v-bind="itemProps">
              <template #prepend></template>
            </v-file-upload-item>
          </template>
        </v-file-upload>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { VFileUpload, VFileUploadItem } from 'vuetify/labs/VFileUpload'
  import { comercialService } from '@/api/services/comercialService'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $toast } from '@/plugins/toast'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { downloadExcelResponse } from '@/shared/utils/fileDownload'

  const props = defineProps({
    modelValue: Boolean,
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const formRef = ref(null)
  const archivo = ref(null)
  const descargandoPlantilla = ref(false)

  function resetForm() {
    archivo.value = null
    formRef.value?.resetValidation()
  }

  function onArchivoRechazado() {
    $toast.error('El archivo debe ser un Excel (.xlsx o .xls)')
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) resetForm()
    },
  )

  async function descargarPlantilla() {
    descargandoPlantilla.value = true
    try {
      const res = await comercialService.getPlantillaImportacionProductos()
      downloadExcelResponse(res, 'PlantillaListaPrecios')
    } catch (error) {
      if (!error._toastShown) $toast.error('Error inesperado al descargar la plantilla')
    } finally {
      descargandoPlantilla.value = false
    }
  }

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Debes seleccionar un archivo Excel')
      return
    }

    const confirmado = await $confirm.confirm({
      title: '¿Aplicar actualización masiva?',
      message:
        'Se actualizarán los productos de esta lista de precios según el archivo cargado. Esta acción no se puede deshacer.',
      labelConfirm: 'Sí, actualizar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    emit('submit', archivo.value)
  }
</script>

<style scoped>
  .plantilla-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background-color: rgba(0, 0, 0, 0.02);
  }

  .plantilla-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background-color: rgba(var(--v-theme-primary), 0.08);
    flex-shrink: 0;
  }

  .excel-dropzone :deep(.v-file-upload-dropzone.v-sheet) {
    border-radius: 12px;
    padding: 40px 16px;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .excel-dropzone
    :deep(
      .v-file-upload-dropzone.v-sheet:not(.v-file-upload-dropzone--error):not(
          .v-file-upload-dropzone--dragging
        )
    ) {
    border-color: rgba(0, 0, 0, 0.15);
    background-color: rgba(0, 0, 0, 0.015);
  }

  .excel-dropzone :deep(.v-file-upload-dropzone--dragging) {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  .excel-dropzone :deep(.v-file-upload-title) {
    font-size: 1rem;
  }

  .excel-dropzone :deep(.v-file-upload-subtitle) {
    font-size: 0.8125rem;
    color: rgb(var(--v-theme-brand-grey-2));
  }
</style>
