import { toast } from "vue-sonner";
import 'vue-sonner/style.css'


// Defaults que se aplican a todos los toasts
const defaults = {
  duration: 3000,
  position: "bottom-right",
};

const $toast = {
  success: (msg, options) =>
    toast.success(msg, { ...defaults, duration: 3000, ...options }),
  error: (msg, options) =>
    toast.error(msg, { ...defaults, duration: 6000, ...options }),
  warning: (msg, options) => toast.warning(msg, { ...defaults, ...options }),
  info: (msg, options) => toast.info(msg, { ...defaults, ...options }),

  // Toast de promesa
 promise: (promise, options) =>
  toast.promise(promise, {
    loading: "Cargando...",
    success: "Completado",
    error: "Algo salió mal",
    ...defaults,   // aplica duration, position, etc.
    ...options,    // sobrescribe cualquier opción que pase el usuario
  }),

  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),
};

export default {
  install() {
    window.$toast = $toast;
  },
};
