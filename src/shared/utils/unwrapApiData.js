export function unwrapApiData(response, fallback = []) {
  return response?.data?.success ? (response.data.data ?? fallback) : fallback
}
