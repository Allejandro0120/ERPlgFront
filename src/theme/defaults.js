export const VUETIFY_DEFAULTS = {
  // ─── Botones ────────────────────────────────────────────────────────────────
  VBtn: {
    rounded: "lg", // border-radius coherente con el sistema
    elevation: 0,
    variant: "flat",
    size: "default",
    style: " letter-spacing: 0.025em; text-transform: none; ",
  },

  VBtnGroup: {
    rounded: "lg",
    elevation: 0,
  },

  // ─── Cards ──────────────────────────────────────────────────────────────────
  VCard: {
    rounded: "lg",
    elevation: 0,
  },

  VCardTitle: {
    style: "font-size: 1rem; font-weight: 700; letter-spacing: -0.01em;",
  },

  VCardSubtitle: {
    style: " font-size: 0.8125rem;",
  },

  // ─── Chips ──────────────────────────────────────────────────────────────────
  VChip: {
    rounded: "lg",
    size: "default",
    elevation: 0,
  },

  // ─── Switch ─────────────────────────────────────────────────────────────────
  VSwitch: {
    color: "primary",
    inset: true,
    hideDetails: "auto",
  },

  // ─── Tooltip ────────────────────────────────────────────────────────────────
  VTooltip: {
    location: "top",
    contentClass: "tooltip",
    transition: "fade-transition",
  },

  // ─── TextField ──────────────────────────────────────────────────────────────

  VTextField: {
    variant: "outlined",
    density: "comfortable",
    rounded: "lg",
    hideDetails: "auto",
    color: "primary",
    style: `
      --v-field-focused-icon-color: rgb(var(--v-theme-primary));
    `,
  },

  // ─── Textarea ───────────────────────────────────────────────────────────────
  VTextarea: {
    variant: "outlined",
    density: "comfortable",
    rounded: "lg",
    hideDetails: "auto",
    color: "primary",
    autoGrow: true,
    rows: 3,
    style: `
      --v-field-focused-icon-color: rgb(var(--v-theme-primary));
    `,
  },

  // ─── VSelect ────────────────────────────────────────────────────────────────
  VSelect: {
    variant: "outlined",
    density: "comfortable",
    rounded: "lg",
    hideDetails: "auto",
    color: "primary",
    menuProps: { rounded: "lg", elevation: 3 },
    style: `
      --v-field-focused-icon-color: rgb(var(--v-theme-primary));
    `,
  },

  // ─── VAutocomplete ──────────────────────────────────────────────────────────
  VAutocomplete: {
    variant: "outlined",
    density: "comfortable",
    rounded: "lg",
    hideDetails: "auto",
    color: "primary",
    menuProps: { rounded: "lg", elevation: 3 },
    style: `
      --v-field-focused-icon-color: rgb(var(--v-theme-primary));
    `,
  },

  // ─── VCombobox ──────────────────────────────────────────────────────────────
  VCombobox: {
    variant: "outlined",
    density: "comfortable",
    rounded: "lg",
    hideDetails: "auto",
    color: "primary",
    menuProps: { rounded: "lg", elevation: 3 },
    style: `
      --v-field-focused-icon-color: rgb(var(--v-theme-primary));
    `,
  },

  // ─── Menus & Listas ─────────────────────────────────────────────────────────
  VMenu: {
    rounded: "lg",
    transition: "fade-transition",
  },

  VList: {
    rounded: "lg",
    elevation: 0,
    density: "comfortable",
    bgColor: "surface",
  },

  VListItem: {
    rounded: "lg",
  },

  // ─── Dialogs ────────────────────────────────────────────────────────────────
  VDialog: {
    maxWidth: 480,
    rounded: "xl",
    scrollStrategy: "none",
    transition: "dialog-transition",
  },

  // ─── Divider ────────────────────────────────────────────────────────────────
  VDivider: {
    color: "outline",
  },

  // ─── Tabs ───────────────────────────────────────────────────────────────────
  VTabs: {
    color: "primary",
    density: "comfortable",
  },

  // ─── Snackbar ───────────────────────────────────────────────────────────────
  VSnackbar: {
    rounded: "lg",
    location: "bottom right",
    timeout: 4000,
  },

  // ─── Alert ──────────────────────────────────────────────────────────────────
  VAlert: {
    rounded: "lg",
    variant: "tonal",
  },

  // ─── Badge ──────────────────────────────────────────────────────────────────
  VBadge: {
    color: "primary",
    rounded: "pill",
  },

  // ─── Progress ───────────────────────────────────────────────────────────────
  VProgressLinear: {
    color: "primary",
    rounded: true,
  },

  VProgressCircular: {
    color: "primary",
  },

  VNavigationDrawer: {
  color: 'surface',
},
};
