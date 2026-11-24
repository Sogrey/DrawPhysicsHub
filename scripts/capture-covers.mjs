/**
 * 抓取各演示 2D 视口截图到 public/covers/*.png
 * 用法：先 pnpm dev，再 node scripts/capture-covers.mjs
 * 环境变量：
 *   DPH_BASE          默认 http://localhost:5174/DrawPhysicsHub
 *                     （Windows 上 Vite 常只绑 [::1]，用 127.0.0.1 会连不上）
 *   DPH_COVERS_ALL=1  全量重抓（默认只补缺失）
 *   DPH_COVER_IDS     逗号分隔 id，只抓指定演示
 *   DPH_COVER_BATCH=m7   只抓 M7（cover-demos.mjs → M7_COVER_IDS）
 *   DPH_COVER_BATCH=m8a  只抓 M8-A（→ M8A_COVER_IDS）
 *   DPH_COVER_BATCH=m8b  只抓 M8-B（→ M8B_COVER_IDS）
 *   DPH_COVER_BATCH=m8c  只抓 M8-C（→ M8C_COVER_IDS）
 *   DPH_COVER_BATCH=m8d  只抓 M8-D（→ M8D_COVER_IDS）
 *   DPH_COVER_BATCH=m8rel 只抓 M8-Rel
 *   DPH_COVER_BATCH=m8f   只抓 M8-F（mech+em+otq+rest）
 *
 * 清单来源：scripts/cover-demos.mjs（与 save-cdp-cover / list-demos 共用）
 */
import { access } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COVER_DEMOS,
  M7_COVER_IDS,
  M8A_COVER_IDS,
  M8B_COVER_IDS,
  M8C_COVER_IDS,
  M8D_COVER_IDS,
  M8REL_COVER_IDS,
  M8F_MECH_COVER_IDS,
  M8F_EM_COVER_IDS,
  M8F_OTQ_COVER_IDS,
  M8F_REST_COVER_IDS,
} from './cover-demos.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'covers')
const base = process.env.DPH_BASE || 'http://localhost:5174/DrawPhysicsHub'

/** @deprecated 兼容旧脚本/文档提及；实际清单在 cover-demos.mjs */
export const ALL_DEMOS = COVER_DEMOS

const onlyMissing = process.env.DPH_COVERS_ALL !== '1'
const batch = (process.env.DPH_COVER_BATCH || '').trim().toLowerCase()
const idFilter = (process.env.DPH_COVER_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

let demos = COVER_DEMOS
if (idFilter.length) {
  demos = COVER_DEMOS.filter((d) => idFilter.includes(d.id))
} else if (batch === 'm7') {
  demos = COVER_DEMOS.filter((d) => M7_COVER_IDS.includes(d.id))
} else if (batch === 'm8a') {
  demos = COVER_DEMOS.filter((d) => M8A_COVER_IDS.includes(d.id))
} else if (batch === 'm8b') {
  demos = COVER_DEMOS.filter((d) => M8B_COVER_IDS.includes(d.id))
} else if (batch === 'm8c') {
  demos = COVER_DEMOS.filter((d) => M8C_COVER_IDS.includes(d.id))
} else if (batch === 'm8d') {
  demos = COVER_DEMOS.filter((d) => M8D_COVER_IDS.includes(d.id))
} else if (batch === 'm8rel') {
  demos = COVER_DEMOS.filter((d) => M8REL_COVER_IDS.includes(d.id))
} else if (batch === 'm8f') {
  const fIds = new Set([
    ...M8F_MECH_COVER_IDS,
    ...M8F_EM_COVER_IDS,
    ...M8F_OTQ_COVER_IDS,
    ...M8F_REST_COVER_IDS,
  ])
  demos = COVER_DEMOS.filter((d) => fIds.has(d.id))
}

async function launchBrowser(chromium) {
  const attempts = [{ channel: 'chrome' }, { channel: 'msedge' }, {}]
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
    console.error(
      '未安装 playwright。可执行：pnpm add -D playwright && pnpm exec playwright install chromium',
    )
    process.exit(1)
  }

  await mkdir(outDir, { recursive: true })
  const browser = await launchBrowser(chromium)
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  console.log(
    `capture-covers: ${demos.length} demos · base=${base}` +
      (batch ? ` · batch=${batch}` : '') +
      (onlyMissing ? ' · only-missing' : ' · force-all'),
  )

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
