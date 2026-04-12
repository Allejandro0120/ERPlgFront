export const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export const allow = {
  onlyDigits: /^[0-9]$/,
  idWithDash: /^[0-9\-]$/,
  decimal: /^[0-9.,]$/,
};

export const blockKey  = (event, pattern) => {
  if (CONTROL_KEYS.has(event.key) || event.ctrlKey || event.metaKey) return;
  if (!pattern.test(event.key)) event.preventDefault();
};
