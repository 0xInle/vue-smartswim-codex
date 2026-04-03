export const publicAsset = (path) => {
  const normalizedPath = String(path).replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${normalizedPath}`
}
