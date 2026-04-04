import axios from "axios";
import { AUTH_CODES } from "@/api/handlers/authCodes";
import { $toast } from "@/plugins/toast";
import {
  closeSession,
  getAbortSignal,
  isSessionClosing,
  tryRefresh,
} from "@/api/authSession";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5002/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.signal = getAbortSignal();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error._handled || axios.isCancel(error)) return Promise.reject(error);
    if (isSessionClosing()) return Promise.reject(error); // ← agregar
    error._handled = true;

    if (!error.response) {
      $toast.error(
        "No se pudo conectar con el servidor. Verifica tu conexión.",
      );
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const code = error.response?.data?.code ?? error.response?.data?.error;
    const message = error.response?.data?.message;

    if (status === 401) {
      const action = AUTH_CODES[code]?.action ?? "logout";

      if (action === "refresh") {
        const refreshed = await tryRefresh();

        if (refreshed) {
          // Reintentar la request original, sin volver a pasar por este interceptor
          error._handled = false;
          return api.request(error.config);
        }
        // Si el refresh falló, closeSession ya fue llamado dentro de tryRefresh
        return Promise.reject(error);
      }

      if (action === "logout") {
        $toast.error(message);
        await closeSession();
        return Promise.reject(error);
      }

      // action === "none": solo mostrar el error
      $toast.error(message);
      return Promise.reject(error);
    }

    $toast.error(message);
    return Promise.reject(error);
  },
);

export default api;
