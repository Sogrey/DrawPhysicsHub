/**
 * 抓取各演示 2D 视口截图到 public/covers/*.png
 * 用法：先 pnpm dev，再 node scripts/capture-covers.mjs
 * 环境变量：
 *   DPH_BASE          默认 http://127.0.0.1:5174/DrawPhysicsHub
 *   DPH_COVERS_ALL=1  全量重抓（默认只补缺失）
 *   DPH_COVER_IDS     逗号分隔 id，只抓指定演示
 */
import { access } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'covers')
const base = process.env.DPH_BASE || 'http://127.0.0.1:5174/DrawPhysicsHub'

const ALL_DEMOS = [
  { id: 'mech-projectile', subject: '力学' },
  { id: 'mech-collision-1d', subject: '力学' },
  { id: 'mech-harmonic', subject: '力学' },
  { id: 'mech-damped', subject: '力学' },
  { id: 'mech-forced', subject: '力学' },
  { id: 'mech-pendulum', subject: '力学' },
  { id: 'mech-circular', subject: '力学' },
  { id: 'mech-natural-frame', subject: '力学' },
  { id: 'mech-incline', subject: '力学' },
  { id: 'mech-rolling', subject: '力学' },
  { id: 'mech-rotation-axis', subject: '力学' },
  { id: 'mech-wave-transverse', subject: '力学' },
  { id: 'mech-standing-wave', subject: '力学' },
  { id: 'mech-energy-curve', subject: '力学' },
  { id: 'mech-angular-momentum', subject: '力学' },
  { id: 'em-point-charge', subject: '电磁学' },
  { id: 'em-dipole', subject: '电磁学' },
  { id: 'em-wire-b', subject: '电磁学' },
  { id: 'em-cyclotron', subject: '电磁学' },
  { id: 'em-lenz', subject: '电磁学' },
  { id: 'opt-double-slit', subject: '光学' },
  { id: 'opt-diffraction', subject: '光学' },
  { id: 'opt-malus', subject: '光学' },
  { id: 'opt-waveplate', subject: '光学' },
  { id: 'opt-refraction', subject: '光学' },
]

const onlyMissing = process.env.DPH_COVERS_ALL !== '1'
const idFilter = (process.env.DPH_COVER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const demos = idFilter.length
  ? ALL_DEMOS.filter((d) => idFilter.includes(d.id))
  : ALL_DEMOS

async function launchBrowser(chromium) {
  const attempts = [
    { channel: 'chrome' },
    { channel: 'msedge' },
    {},
  ]
  let lastErr
  for (const opts of attempts) {
    try {
      return await chromium.launch({ headless: true, ...opts })
    } catch (e) {
      lastErr = e
      console.warn('launch failed', opts, String(e.message || e))
    }
  }
  throw lastErr
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('未安装 playwright。可执行：pnpm add -D playwright && pnpm exec playwright install chromium')
    process.exit(1)
  }

  await mkdir(outDir, { recursive: true })
  const browser = await launchBrowser(chromium)
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  for (const d of demos) {
    const path = join(outDir, `${d.id}.png`)
    if (onlyMissing) {
      try {
        await access(path)
        console.log('skip existing', d.id)
        continue
      } catch {
        /* missing */
      }
    }
    const url = `${base}/s/${encodeURIComponent(d.subject)}/${d.id}`
    console.log('open', url)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(1500)

    const playBtn = page.getByRole('button', { name: '播放' })
    if (await playBtn.count()) {
      await playBtn.click()
      await page.waitForTimeout(1000)
      const pauseBtn = page.getByRole('button', { name: '暂停' })
      if (await pauseBtn.count()) await pauseBtn.click()
      await page.waitForTimeout(200)
    }

    // 优先 canvas 截图；失败则用 toDataURL
    const canvas = page.locator('.viewport.dark canvas').first()
    if (await canvas.count()) {
      try {
        await canvas.screenshot({ path, type: 'png' })
        console.log('saved', path)
        continue
      } catch (e) {
        console.warn('canvas.screenshot failed, try toDataURL', e.message || e)
      }
      const dataUrl = await page.evaluate(() => {
        const c = document.querySelector('.viewport.dark canvas')
        return c ? c.toDataURL('image/png') : null
      })
      if (dataUrl?.startsWith('data:image')) {
        const { writeFileSync } = await import('node:fs')
        writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'))
        console.log('saved via toDataURL', path)
        continue
      }
    }

    const stage = page.locator('.stage').first()
    if (await stage.count()) {
      await stage.screenshot({ path, type: 'png' })
      console.log('saved stage', path)
    } else {
      console.error('no canvas/stage for', d.id)
    }
  }

  await browser.close()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
