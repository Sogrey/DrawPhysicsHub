/**
 * SPA history 路由在静态托管上的刷新兜底：复制 index.html → 404.html
 * 由 `pnpm build` 末尾调用；CI 中亦有同名步骤（幂等）。
 */
import { copyFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const index = join(root, 'dist', 'index.html')
const fallback = join(root, 'dist', '404.html')
if (!existsSync(index)) {
  console.error('spa-404: dist/index.html 不存在，请先 vite build')
  process.exit(1)
}
copyFileSync(index, fallback)
console.log('spa-404: wrote dist/404.html')
