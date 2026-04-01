<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto" v-if="hasPermission('Recepcion.ADD')">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            class="text-none w-100"
            @click="abrirCrear"
          >
            Añadir Acta
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <base-table-local
      title="Actas de Recepción"
      :headers="headers"
      :items="actasConCampos"
      item-key="IdActa"
      :loading="false"
      :row-actions="rowActions"
      empty-text="No se encontraron actas"
      searchable
      search-placeholder="Buscar por acta, proveedor o factura..."
    >
      <template #item.EstadoActa="{ item }">
        <v-chip
          :color="estadoColor(item.EstadoActa)"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          <v-icon icon="mdi-tag" start size="14" />
          {{ item.EstadoActa }}
        </v-chip>
      </template>

      <template #item.Factura="{ item }">
        {{ item.PrefijoFacturaRecibida }}-{{ item.NumeroFacturaRecibida }}
      </template>
    </base-table-local>

    <recepcion-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :acta="dialog.acta"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import PageHeaderActions from "@/shared/ui/PageHeaderActions.vue";
import BaseTableLocal from "@/shared/ui/BaseTableLocal.vue";
import RecepcionDialog from "@/modules/mercancia/components/RecepcionDialog.vue";
import { actasMock } from "@/modules/mercancia/utils/recepcionMock";
import { useAuthStore } from "@/stores/auth.store";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/estadoColors";

const authStore = useAuthStore();
const hasPermission = (permiso) => authStore.hasPermission(permiso);

const actas = ref(actasMock);
const actasConCampos = computed(() =>
  actas.value.map((a) => ({
    ...a,
    Factura: `${a.PrefijoFacturaRecibida}-${a.NumeroFacturaRecibida}`,
    CentroDistribucionNombre: a.CentroDistribucion?.Nombre || "",
  })),
);

const headers = [
  { title: "Nro Acta", key: "NroActa", sortable: true, searchable: true },
  {
    title: "Proveedor",
    key: "ProveedorNombre",
    sortable: true,
    searchable: true,
  },
  {
    title: "Factura",
    key: "Factura",
    sortable: false,
    searchable: true,
  },
  {
    title: "Fecha Acta",
    key: "FechaActa",
    sortable: true,
  },
  {
    title: "Centro Distribución",
    key: "CentroDistribucionNombre",
    sortable: true,
  },
  {
    title: "Estado",
    key: "EstadoActa",
    align: "center",
    sortable: false,
  },
];

const rowActions = [
  {
    label: "Ver",
    icon: "mdi-eye",
    color: "primary",
    action: (item) => abrirDialog("view", item),
  },
  {
    label: "Editar",
    icon: "mdi-pencil",
    action: (item) => abrirDialog("edit", item),
    permission: "Recepcion.EDIT",
    visible: () => hasPermission("Recepcion.EDIT"),
  },
];

const dialog = ref({ open: false, mode: "view", acta: null });

function abrirCrear() {
  dialog.value = { open: true, mode: "create", acta: null };
}

function abrirDialog(mode, acta) {
  dialog.value = { open: true, mode, acta };
}

function onSubmit(payload) {
  // Simulación de guardado sobre el mock
  if (dialog.value.mode === "create") {
    const nextId = Math.max(...actas.value.map((a) => a.IdActa)) + 1;
    actas.value = [{ ...payload, IdActa: nextId }, ...actas.value];
  } else if (dialog.value.mode === "edit" && payload.IdActa) {
    actas.value = actas.value.map((a) =>
      a.IdActa === payload.IdActa ? { ...a, ...payload } : a,
    );
  }
  dialog.value.open = false;
}

const estadoColor = (estado) => getEstadoColor(estado, DOMINIOS_ESTADO.ACTA);
</script>
