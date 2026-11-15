/** 拼上 Vite `base`（如 `/DrawPhysicsHub/`），避免 `/covers/...` 落到站点根路径 404 */
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const rel = path.replace(/^\//, '')
  return `${base.endsWith('/') ? base : `${base}/`}${rel}`
}
