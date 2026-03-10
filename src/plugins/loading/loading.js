import { reactive } from "vue";

const state = reactive({
  active: false,
  text: "Cargando...",
});

const $loading = {
  state,
  show(text) {
    state.text = text || "Cargando...";
    state.active = true;
  },
  hide() {
    state.active = false;
  },
};

export default {
  install() {
    window.$loading = $loading;
  },
};