<template>
  <v-row class="mt-2" density="compact">
    <v-col cols="12" sm="5">
      <v-text-field
        v-model="form.NroActa"
        label="Número de Acta"
        prepend-inner-icon="mdi-file"
        :readonly="true"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-select
        id="Estado"
        v-model="form.IdEstado"
        item-title="Nombre"
        item-value="IdEstado"
        :items="estadosConColor"
        label="Estado"
        name="Estado"
        prepend-inner-icon="mdi-note-check"
        :readonly="!canEdit('IdEstado')"
        variant="outlined"
      >
        <template #selection="{ item }">
          <v-chip class="estado-chip" :color="item.color" label variant="tonal">
            <v-icon class="ml-1" :color="item.color" icon="mdi-tag" size="14" start />
            {{ item.Nombre }}
          </v-chip>
        </template>

        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" title="">
            <v-chip :color="item.color" label variant="tonal">
              <v-icon class="ml-1" :color="item.color" icon="mdi-tag" size="14" start />
              {{ item.Nombre }}
            </v-chip>
          </v-list-item>
        </template>
      </v-select>
    </v-col>
    <v-col v-if="form.FechaActa" cols="12" sm="4">
      <v-text-field
        :model-value="fechaActaDisplay"
        label="Fecha Acta"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12">
      <v-select
        id="IdProveedor"
        v-model="form.IdProveedor"
        :clearable="canEdit('IdProveedor')"
        :readonly="!canEdit('IdProveedor')"
        item-title="Nombre"
        item-value="IdProveedor"
        :items="proveedores"
        label="Proveedor"
        name="IdProveedor"
        prepend-inner-icon="mdi-truck"
        :rules="[rules.required]"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-select
        :model-value="form.IdCedi"
        item-title="NombreCedi"
        item-value="IdCedi"
        :items="cedis"
        label="Cedi"
        prepend-inner-icon="mdi-warehouse"
        :readonly="!canEdit('IdCedi')"
        variant="outlined"
        @update:model-value="emit('cedi-change', $event)"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-select
        v-model="form.IdBodega"
        item-title="NombreBodega"
        item-value="IdBodega"
        :items="bodegas"
        label="Bodega"
        prepend-inner-icon="mdi-door-open"
        :readonly="!canEdit('IdBodega')"
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="3">
      <v-text-field
        v-model="form.PrefijoFacturaRecibida"
        label="Prefijo Factura"
        prepend-inner-icon="mdi-invoice-outline"
        :readonly="!canEdit('PrefijoFacturaRecibida')"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="5">
      <v-text-field
        v-model="form.NumeroFacturaRecibida"
        label="Número Factura"
        prepend-inner-icon="mdi-invoice-text-outline"
        :readonly="!canEdit('NumeroFacturaRecibida')"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <template v-if="canEdit('FechaFacturaRecibida')">
        <v-menu
          v-model="menuFechaFactura"
          :close-on-content-click="false"
          min-width="auto"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props: menuFechaFacturaProps }">
            <v-text-field
              class="cursor-pointer"
              v-model="fechaFacturaRecibidaDisplay"
              v-bind="menuFechaFacturaProps"
              label="Fecha Factura"
              prepend-inner-icon="mdi-calendar"
              readonly
              variant="outlined"
            />
          </template>
          <v-date-picker
            v-model="form.FechaFacturaRecibida"
            color="primary"
            :first-day-of-week="1"
            locale="es"
            @input="menuFechaFactura = false"
          />
        </v-menu>
      </template>
      <template v-else>
        <v-text-field
          v-model="fechaFacturaRecibidaDisplay"
          label="Fecha Factura"
          prepend-inner-icon="mdi-calendar"
          readonly
          variant="outlined"
        />
      </template>
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="form.Observaciones"
        label="Observaciones / Orden de compra"
        :readonly="!canEdit('Observaciones')"
        variant="outlined"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { computed, ref, toRefs } from 'vue'
  import { formatDate, formatDateTime } from '@/shared/utils/dateFormatter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    permisos: { type: Object, default: () => ({}) },
    estadosCatalogo: { type: Array, default: () => [] },
    proveedores: { type: Array, default: () => [] },
    cedis: { type: Array, default: () => [] },
    bodegas: { type: Array, default: () => [] },
  })
  const emit = defineEmits(['cedi-change'])

  const canEdit = (campo) => !props.isReadonly && (props.permisos[campo] ?? false)
  const { form, estadosCatalogo, isReadonly, proveedores, cedis, bodegas } = toRefs(props)

  const menuFechaFactura = ref(false)
  const estadosConColor = computed(() =>
    (estadosCatalogo.value || []).map((estado) => ({
      ...estado,
      color: getEstadoColor(estado.Nombre, DOMINIOS_ESTADO.ACTA),
    })),
  )

  const fechaFacturaRecibidaDisplay = computed(() => {
    return props.form.FechaFacturaRecibida ? formatDate(props.form.FechaFacturaRecibida) : ''
  })

  const fechaActaDisplay = computed(() => {
    return props.form.FechaActa ? formatDateTime(props.form.FechaActa) : ''
  })
</script>

<style scoped></style>
