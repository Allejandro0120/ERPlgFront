import { $toast } from '@/plugins/toast'

/**
 * Descarga la respuesta binaria (blob) de una petición axios como archivo.
 * Valida que la respuesta y el blob tengan contenido antes de disparar la descarga.
 * @param {*} res - Respuesta de axios con { data } en formato blob
 * @param {string} fileName - Nombre del archivo a descargar (con extensión)
 * @param {string} mimeType - Tipo MIME del archivo (ej: 'application/pdf')
 * @returns {boolean} true si la descarga se disparó correctamente
 */
function downloadBlobResponse(res, fileName, mimeType) {
  if (!res || !res.data) {
    $toast.error('No se pudo generar el archivo.')
    return false
  }

  const blob = new Blob([res.data], { type: mimeType })
  if (blob.size === 0) {
    $toast.error('El archivo está vacío.')
    return false
  }

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  window.URL.revokeObjectURL(url)
  link.remove()

  return true
}

/**
 * Descarga la respuesta binaria (blob) de una petición axios como PDF.
 * @param {*} res - Respuesta de axios con { data } en formato blob
 * @param {string} fileName - Nombre del archivo (sin extensión o con .pdf)
 */
export function downloadPdfResponse(res, fileName) {
  const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
  return downloadBlobResponse(res, finalName, 'application/pdf')
}
