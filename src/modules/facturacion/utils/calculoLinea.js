export const IVA_DEFAULT = 19

// Calcula los valores derivados de una línea de producto (cotización o pedido) a partir
// de sus campos editables. Se usa tanto en los modales de detalle (previsualización en
// vivo) como en los totales de las tablas de productos.
export function calcularLinea({ Cantidad, PrecioUnitario, PorcentajeDescuento, PorcentajeIva }) {
  const cantidad = Number(Cantidad) || 0
  const precioUnitario = Number(PrecioUnitario) || 0
  const porcentajeDescuento = Number(PorcentajeDescuento) || 0
  const porcentajeIva = Number(PorcentajeIva) || 0

  const bruto = cantidad * precioUnitario
  const valorDescuento = bruto * (porcentajeDescuento / 100)
  const subtotal = bruto - valorDescuento
  const valorIva = subtotal * (porcentajeIva / 100)
  const total = subtotal + valorIva

  return { bruto, valorDescuento, subtotal, valorIva, total }
}
