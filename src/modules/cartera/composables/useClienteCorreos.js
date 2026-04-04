import { ref, computed } from "vue";
import { $confirm } from "@/plugins/confirm/confirm.js";
import { hasCollectionChanges } from "@/shared/composables/useChangePayload";

export function useClienteCorreos({ isReadonly }) {
  let localCorreoCounter = 0;

  const correos = ref([]);
  const correosSnapshot = ref([]);

  const correoDialog = ref({
    open: false,
    mode: "create",
    correo: null,
    editIdx: null,
  });

  function apiCorreoToLocal(apiCorreo) {
    return {
      LocalId: ++localCorreoCounter,
      IdCorreo: apiCorreo.IdCorreo,
      IdTipoCorreo: apiCorreo.IdTipoCorreo ?? null,
      Email: apiCorreo.Email ?? "",
    };
  }

  function localCorreoToApi(correo, includeId = true) {
    const payload = {
      IdTipoCorreo: correo.IdTipoCorreo,
      Email: correo.Email,
    };

    if (includeId && correo.IdCorreo) {
      payload.IdCorreo = correo.IdCorreo;
    }

    return payload;
  }

  function correoSerializable(correo) {
    return {
      IdCorreo: correo.IdCorreo ?? null,
      IdTipoCorreo: correo.IdTipoCorreo ?? null,
      Email: correo.Email ?? "",
    };
  }

  function abrirAgregarCorreo() {
    correoDialog.value = {
      open: true,
      mode: "create",
      correo: null,
      editIdx: null,
    };
  }

  function abrirEditarCorreo(idx) {
    const correo = correos.value[idx];
    correoDialog.value = {
      open: true,
      mode: "edit",
      editIdx: idx,
      correo: {
        IdCorreo: correo.IdCorreo,
        IdTipoCorreo: correo.IdTipoCorreo,
        Email: correo.Email,
      },
    };
  }

  function handleEditarCorreo(item) {
    const idx = correos.value.findIndex((c) => c.LocalId === item.LocalId);
    if (idx !== -1) {
      abrirEditarCorreo(idx);
    }
  }

  async function handleEliminarCorreo(item) {
    const idx = correos.value.findIndex((c) => c.LocalId === item.LocalId);
    if (idx === -1) return;

    const correoLabel = item.Email || "(sin correo)";
    const confirmed = await $confirm.warning({
      title: "¿Eliminar correo?",
      message: `Se eliminará el correo ${correoLabel} del cliente.`,
      labelConfirm: "Sí, eliminar",
      labelCancel: "Cancelar",
    });

    if (!confirmed) return;
    correos.value.splice(idx, 1);
  }

  function onCorreoSubmit({ payload, mode }) {
    const local = {
      IdTipoCorreo: payload.IdTipoCorreo,
      Email: payload.Email,
    };

    if (mode === "create") {
      correos.value.push({
        LocalId: ++localCorreoCounter,
        IdCorreo: null,
        ...local,
      });
    } else if (mode === "edit" && correoDialog.value.editIdx !== null) {
      const idx = correoDialog.value.editIdx;
      correos.value[idx] = {
        ...correos.value[idx],
        ...local,
      };
    }

    correoDialog.value.open = false;
  }

  const correosHeaders = computed(() => [
    { title: "#", key: "indice", sortable: false, align: "left" },
    { title: "Tipo", key: "IdTipoCorreo", sortable: false },
    { title: "Correo", key: "Email", sortable: false },
  ]);

  const correoRowActions = [
    {
      label: "Editar",
      icon: "$pencil",
      action: (item) => handleEditarCorreo(item),
      visible: () => !isReadonly.value,
    },
    {
      label: "Eliminar",
      icon: "$delete",
      color: "error",
      action: (item) => handleEliminarCorreo(item),
      visible: () => !isReadonly.value,
    },
  ];

  function hydrateCorreos(apiCorreos = []) {
    const locales = Array.isArray(apiCorreos)
      ? apiCorreos.map(apiCorreoToLocal)
      : [];

    correos.value = locales;
    correosSnapshot.value = locales.map(correoSerializable);
  }

  function setCorreosSnapshot(snapshot = []) {
    correosSnapshot.value = snapshot;
  }

  function resetCorreos() {
    correos.value = [];
    correosSnapshot.value = [];
    correoDialog.value = {
      open: false,
      mode: "create",
      correo: null,
      editIdx: null,
    };
  }

  function hasCorreosChanges() {
    return hasCollectionChanges(
      correos.value,
      correosSnapshot.value,
      correoSerializable,
    );
  }

  function getCorreosChanges() {
    if (!hasCorreosChanges()) {
      return null;
    }

    const snapshotById = new Map(
      (correosSnapshot.value || [])
        .filter((correo) => !!correo?.IdCorreo)
        .map((correo) => [correo.IdCorreo, correo]),
    );

    const idsActuales = new Set(
      correos.value
        .filter((correo) => !!correo.IdCorreo)
        .map((correo) => correo.IdCorreo),
    );

    const hayEliminados = Array.from(snapshotById.keys()).some(
      (id) => !idsActuales.has(id),
    );

    // Para respetar el contrato del backend, cuando hay eliminaciones
    // se envía el estado completo actual del arreglo.
    if (hayEliminados) {
      return correos.value.map((correo) =>
        correo.IdCorreo
          ? localCorreoToApi(correo, true)
          : localCorreoToApi(correo, false),
      );
    }

    return correos.value
      .map((correo) => {
        if (!correo.IdCorreo) {
          return localCorreoToApi(correo, false);
        }

        const original = snapshotById.get(correo.IdCorreo);
        if (!original) {
          return localCorreoToApi(correo, true);
        }

        const changedTipoCorreo =
          correo.IdTipoCorreo !== original.IdTipoCorreo;
        const changedEmail = correo.Email !== original.Email;

        if (changedTipoCorreo || changedEmail) {
          return localCorreoToApi(correo, true);
        }

        return null;
      })
      .filter(Boolean);
  }

  return {
    correos,
    correosSnapshot,
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
  };
}
