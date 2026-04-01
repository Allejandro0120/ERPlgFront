import { mdiAlertCircleOutline, mdiAlertOutline, mdiCheckCircleOutline, mdiCloseCircleOutline, mdiHelpCircleOutline, mdiInformationOutline } from "@mdi/js";
import { reactive } from "vue";

const TYPES = {
  success: { color: "success", icon: mdiCheckCircleOutline,  actions: false },
  error:   { color: "error",   icon: mdiCloseCircleOutline,  actions: false },
  warning: { color: "warning", icon: mdiAlertOutline,         actions: true  },
  info:    { color: "info",    icon: mdiInformationOutline,   actions: false },
  confirm: { color: "primary", icon: mdiHelpCircleOutline,   actions: true  },
  danger:  { color: "error",   icon: mdiAlertCircleOutline,  actions: true  },
};

const state = reactive({
  active:       false,
  title:        "",
  message:      "",
  color:        "primary",
  icon:         null,
  actions:      true,
  persistent:   false,
  labelConfirm: "Confirmar",
  labelCancel:  "Cancelar",
  resolve:      null,
});

const $confirm = {
  state,

  show(options = {}) {
    const typeDefaults = TYPES[options.type] ?? TYPES.confirm;

    state.title        = options.title        ?? "Confirmación";
    state.message      = options.message      ?? "";
    state.color        = options.color        ?? typeDefaults.color;
    state.icon         = options.icon         ?? typeDefaults.icon;
    state.actions      = options.actions      ?? typeDefaults.actions;
    state.persistent   = options.persistent   ?? false;
    state.labelConfirm = options.labelConfirm ?? (state.actions ? "Confirmar" : "Aceptar");
    state.labelCancel  = options.labelCancel  ?? "Cancelar";
    state.active       = true;

    return new Promise((resolve) => {
      state.resolve = resolve;
    });
  },

  accept() {
    state.resolve?.(true);
    state.resolve = null;
    state.active  = false;
  },

  cancel() {
    state.resolve?.(false);
    state.resolve = null;
    state.active  = false;
  },

  // ─── Shortcuts ───────────────────────────────────────────────────────────
  success: (opts = {}) => $confirm.show({ type: "success", ...opts }),
  error:   (opts = {}) => $confirm.show({ type: "error",   ...opts }),
  info:    (opts = {}) => $confirm.show({ type: "info",    ...opts }),
  warning: (opts = {}) => $confirm.show({ type: "warning", ...opts }),
  confirm: (opts = {}) => $confirm.show({ type: "confirm", ...opts }),
  danger:  (opts = {}) => $confirm.show({ type: "danger",  ...opts }),
};

export { $confirm };

export default {
  install(app) {
    app.config.globalProperties.$confirm = $confirm;
        window.$confirm = $confirm;

  },
};