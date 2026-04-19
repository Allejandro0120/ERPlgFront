import { ref, computed } from "vue";
import {
  hasCollectionChanges,
  getChangedCollectionPayload,
} from "@/shared/composables/useChangePayload";

const sucursalPatchFields = [
  "NombreSucursal",
  "Telefono",
  "CorreoGeneral",
  "Direccion",
  "IdCentroPoblado",
  "Habilitada",
];

export function useClienteSucursales({ isReadonly }) {
  let localSucursalCounter = 0;

  const sucursales = ref([]);
  const sucursalesSnapshot = ref([]);

  const sucursalDialog = ref({
    open: false,
    mode: "create",
    sucursal: null,
    editIdx: null,
  });

  function apiSucursalToLocal(apiSucursal) {
    return {
      LocalId: ++localSucursalCounter,
      IdDepartamento: apiSucursal.IdDepartamento ?? null,
      IdMunicipio: apiSucursal.IdMunicipio ?? null,
      IdSucursal: apiSucursal.IdSucursal,
      NombreSucursal: apiSucursal.NombreSucursal ?? "",
      Telefono: apiSucursal.Telefono ?? "",
      CorreoGeneral: apiSucursal.CorreoGeneral ?? "",
      Direccion: apiSucursal.Direccion ?? "",
      IdCentroPoblado: apiSucursal.IdCentroPoblado ?? null,
      Habilitada: apiSucursal.Habilitada ?? true,
      NombreDepartamento: apiSucursal.NombreDepartamento,
      NombreMunicipio: apiSucursal.NombreMunicipio,
      NombreCentroPoblado: apiSucursal.NombreCentroPoblado,
    };
  }

  function localSucursalToApi(sucursal, includeId = true) {
    const payload = {
      NombreSucursal: sucursal.NombreSucursal,
      Telefono: sucursal.Telefono,
      CorreoGeneral: sucursal.CorreoGeneral,
      Direccion: sucursal.Direccion,
      IdCentroPoblado: sucursal.IdCentroPoblado,
      Habilitada: sucursal.Habilitada,
    };

    if (includeId && sucursal.IdSucursal) {
      payload.IdSucursal = sucursal.IdSucursal;
    }

    return payload;
  }

  function sucursalSerializable(sucursal) {
    return {
      IdSucursal: sucursal.IdSucursal ?? null,
      NombreSucursal: sucursal.NombreSucursal ?? "",
      Telefono: sucursal.Telefono ?? "",
      CorreoGeneral: sucursal.CorreoGeneral ?? "",
      Direccion: sucursal.Direccion ?? "",
      IdCentroPoblado: sucursal.IdCentroPoblado ?? null,
      Habilitada: sucursal.Habilitada ?? true,
      IdDepartamento: sucursal.IdDepartamento ?? null,
      IdMunicipio: sucursal.IdMunicipio ?? null,
    };
  }

  function toDialogSucursal(sucursal) {
    return {
      IdSucursal: sucursal.IdSucursal,
      NombreSucursal: sucursal.NombreSucursal,
      Telefono: sucursal.Telefono,
      CorreoGeneral: sucursal.CorreoGeneral,
      Direccion: sucursal.Direccion,
      IdCentroPoblado: sucursal.IdCentroPoblado,
      Habilitada: sucursal.Habilitada,
      IdDepartamento: sucursal.IdDepartamento,
      IdMunicipio: sucursal.IdMunicipio,
      NombreDepartamento: sucursal.NombreDepartamento,
      NombreMunicipio: sucursal.NombreMunicipio,
      NombreCentroPoblado: sucursal.NombreCentroPoblado,
    };
  }

  function abrirAgregarSucursal() {
    sucursalDialog.value = {
      open: true,
      mode: "create",
      sucursal: null,
      editIdx: null,
    };
  }

  function abrirEditarSucursal(idx) {
    const sucursal = sucursales.value[idx];
    sucursalDialog.value = {
      open: true,
      mode: "edit",
      editIdx: idx,
      sucursal: toDialogSucursal(sucursal),
    };
  }

  function abrirVerSucursal(idx) {
    const sucursal = sucursales.value[idx];
    sucursalDialog.value = {
      open: true,
      mode: "view",
      editIdx: idx,
      sucursal: toDialogSucursal(sucursal),
    };
  }

  function handleEditarSucursal(item) {
    const idx = sucursales.value.findIndex((s) => s.LocalId === item.LocalId);
    if (idx !== -1) {
      abrirEditarSucursal(idx);
    }
  }

  function handleVerSucursal(item) {
    const idx = sucursales.value.findIndex((s) => s.LocalId === item.LocalId);
    if (idx !== -1) {
      abrirVerSucursal(idx);
    }
  }

  function onSucursalSubmit({ payload, mode }) {
    const local = {
      NombreSucursal: payload.NombreSucursal,
      Telefono: payload.Telefono,
      CorreoGeneral: payload.CorreoGeneral,
      Direccion: payload.Direccion,
      IdCentroPoblado: payload.IdCentroPoblado,
      Habilitada: payload.Habilitada,
      IdDepartamento: payload.IdDepartamento,
      IdMunicipio: payload.IdMunicipio,
    };

    if (mode === "create") {
      sucursales.value.push({
        LocalId: ++localSucursalCounter,
        IdSucursal: null,
        ...local,
      });
    } else if (mode === "edit" && sucursalDialog.value.editIdx !== null) {
      const idx = sucursalDialog.value.editIdx;
      sucursales.value[idx] = {
        ...sucursales.value[idx],
        ...local,
      };
    }

    sucursalDialog.value.open = false;
  }

  const sucursalesHeaders = computed(() => [
    { title: "#", key: "indice", sortable: false, align: "left" },
    { title: "Nombre", key: "NombreSucursal", sortable: false },
    { title: "Dirección", key: "Direccion", sortable: false },
    { title: "Teléfono", key: "Telefono", sortable: false },
    { title: "Correo", key: "CorreoGeneral", sortable: false },
    { title: "Estado", key: "Habilitada", sortable: false, align: "center" },
  ]);

  const sucursalRowActions = [
    {
      label: "Editar",
      icon: "$pencil",
      action: (item) => handleEditarSucursal(item),
      visible: () => !isReadonly.value,
    },
    {
      label: "Ver detalle",
      icon: "$eye",
      action: (item) => handleVerSucursal(item),
      visible: () => isReadonly.value,
    },
  ];

  function hydrateSucursales(apiSucursales = []) {
    const locales = Array.isArray(apiSucursales)
      ? apiSucursales.map(apiSucursalToLocal)
      : [];

    sucursales.value = locales;
    sucursalesSnapshot.value = locales.map(sucursalSerializable);
  }

  function setSucursalesSnapshot(snapshot = []) {
    sucursalesSnapshot.value = snapshot;
  }

  function resetSucursales() {
    sucursales.value = [];
    sucursalesSnapshot.value = [];
    sucursalDialog.value = {
      open: false,
      mode: "create",
      sucursal: null,
      editIdx: null,
    };
  }

  function hasSucursalesChanges() {
    return hasCollectionChanges(
      sucursales.value,
      sucursalesSnapshot.value,
      sucursalSerializable,
    );
  }

  function getSucursalesChanges() {
    return getChangedCollectionPayload({
      currentList: sucursales.value,
      snapshotList: sucursalesSnapshot.value,
      idKey: "IdSucursal",
      patchFields: sucursalPatchFields,
      toCreatePayload: (item) => localSucursalToApi(item, false),
      toFallbackPayload: (item) => localSucursalToApi(item, true),
    });
  }

  return {
    sucursales,
    sucursalesSnapshot,
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
  };
}
