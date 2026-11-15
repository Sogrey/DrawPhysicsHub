/**
 * 抓取各演示 2D 视口截图到 public/covers/*.png
 * 用法：先 pnpm dev，再 node scripts/capture-covers.mjs
 * 需要：pnpm add -D playwright && pnpm exec playwright install chromium
 */
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'covers')
const base = process.env.DPH_BASE || 'http://127.0.0.1:5174/DrawPhysicsHub'

const demos = [
  { id: 'mech-projectile', subject: '力学' },
  { id: 'mech-collision-1d', subject: '力学' },
  { id: 'mech-harmonic', subject: '力学' },
  { id: 'mech-damped', subject: '力学' },
  { id: 'mech-forced', subject: '力学' },
  { id: 'mech-pendulum', subject: '力学' },
  { id: 'mech-circular', subject: '力学' },
  { id: 'mech-incline', subject: '力学' },
  { id: 'mech-rolling', subject: '力学' },
]

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('未安装 playwright。可执行：pnpm add -D playwright && pnpm exec playwright install chromium')
    console.error('当前已用 SVG 示意封面；安装后重跑本脚本可生成真实 png。')
    process.exit(0)
  }

  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  for (const d of demos) {
    const url = `${base}/s/${encodeURIComponent(d.subject)}/${d.id}`
    console.log('open', url)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(800)
    const canvas = page.locator('.viewport.dark canvas').first()
    const path = join(outDir, `${d.id}.png`)
    if (await canvas.count()) {
      await canvas.screenshot({ path })
      console.log('saved', path)
    } else {
      // 整页舞台兜底
      const stage = page.locator('.stage').first()
      await stage.screenshot({ path })
      console.log('saved stage', path)
    }
  }

  await browser.close()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
