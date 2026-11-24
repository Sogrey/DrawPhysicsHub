/**
 * 把 CDP Runtime.evaluate 返回的 data:image/... 写成 public/covers/<id>.png
 *
 * 用法：
 *   node scripts/save-cdp-cover.mjs --list
 *   node scripts/save-cdp-cover.mjs --list m7
 *   node scripts/save-cdp-cover.mjs <demoId>
 *   node scripts/save-cdp-cover.mjs <demoId> --file path/to/data-url.txt
 *   echo data:image/png;base64,... | node scripts/save-cdp-cover.mjs <demoId> --stdin
 *
 * 浏览器内可先执行（需已打开对应演示页）：
 *   document.querySelector('.viewport.dark canvas')?.toDataURL('image/png')
 * 再把 CDP 返回值交给本脚本；或把 data URL 存文件后 --file。
 *
 * 清单：scripts/cover-demos.mjs（与 capture-covers 共用）
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  COVER_DEMOS,
  M7_COVER_IDS,
  isKnownCoverId,
  subjectForCoverId,
} from './cover-demos.mjs'

const args = process.argv.slice(2)

if (args[0] === '--list' || args[0] === '-l') {
  const mode = (args[1] || 'all').toLowerCase()
  const list =
    mode === 'm7'
      ? COVER_DEMOS.filter((d) => M7_COVER_IDS.includes(d.id))
      : COVER_DEMOS
  console.log(mode === 'm7' ? `M7 cover ids (${list.length}):` : `All cover ids (${list.length}):`)
  for (const d of list) console.log(`  ${d.id}\t${d.subject}`)
  if (mode === 'm7') {
    console.log('\nPlaywright batch:')
    console.log(
      "  $env:DPH_COVER_BATCH='m7'; $env:DPH_COVERS_ALL='1'; $env:DPH_BASE='http://localhost:5174/DrawPhysicsHub'; node scripts/capture-covers.mjs",
    )
  }
  process.exit(0)
}

const id = args[0]
if (!id || id.startsWith('-')) {
  console.error(`usage:
  node scripts/save-cdp-cover.mjs --list [m7|all]
  node scripts/save-cdp-cover.mjs <demoId> [--file path] [--stdin]

known example: thermo-maxwell, qm-barrier, qm-alpha
`)
  process.exit(1)
}

if (!isKnownCoverId(id)) {
  console.warn(
    `warn: '${id}' not in cover-demos.mjs — still writing png; remember LIVE_COVERS + COVER_DEMOS`,
  )
} else {
  console.log('demo', id, '·', subjectForCoverId(id))
}

function extractDataUrl(raw) {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (s.startsWith('data:image')) return s
  try {
    const j = JSON.parse(s)
    const v = j.result?.result?.value ?? j.result?.value ?? j.value
    if (typeof v === 'string' && v.startsWith('data:image')) return v
  } catch {
    /* not json */
  }
  // 宽松：整段文本里搜 data:image
  const m = s.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=\s]+/)
  if (m) return m[0].replace(/\s+/g, '')
  return null
}

async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

let dataUrl = null
const fileIdx = args.indexOf('--file')
if (args.includes('--stdin')) {
  dataUrl = extractDataUrl(await readStdin())
} else if (fileIdx >= 0 && args[fileIdx + 1]) {
  dataUrl = extractDataUrl(readFileSync(args[fileIdx + 1], 'utf8'))
} else {
  const logDir = 'C:/Users/Administrator/.cursor/browser-logs'
  try {
    const files = readdirSync(logDir)
      .filter((f) => f.startsWith('cdp-response-Runtime.evaluate-') && f.endsWith('.json'))
      .map((f) => ({ f, t: statSync(join(logDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)
    const latest = files[0]
    if (!latest) {
      console.error('no cdp response in', logDir)
      process.exit(1)
    }
    dataUrl = extractDataUrl(readFileSync(join(logDir, latest.f), 'utf8'))
    if (!dataUrl) {
      console.error('no data url in', latest.f)
      process.exit(1)
    }
    console.log('from', latest.f)
  } catch (e) {
    console.error(e.message || e)
    process.exit(1)
  }
}

if (!dataUrl?.startsWith('data:image')) {
  console.error('no data:image payload')
  process.exit(1)
}

mkdirSync(join('public', 'covers'), { recursive: true })
const b64 = dataUrl.split(',')[1]
if (!b64) {
  console.error('malformed data url')
  process.exit(1)
}
const buf = Buffer.from(b64.replace(/\s+/g, ''), 'base64')
const out = join('public', 'covers', `${id}.png`)
writeFileSync(out, buf)
console.log('wrote', out, buf.length, 'bytes')
console.log('checklist: LIVE_COVERS["' + id + '"] + cover-demos.mjs + pnpm list:demos')
