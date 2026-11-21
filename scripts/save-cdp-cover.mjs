/**
 * 把最新一次 CDP Runtime.evaluate 返回的 data:image/... 写成 public/covers/<id>.png
 * 用法：
 *   node scripts/save-cdp-cover.mjs <demoId>
 *   node scripts/save-cdp-cover.mjs <demoId> --file path/to/data-url.txt
 *   echo data:image/png;base64,... | node scripts/save-cdp-cover.mjs <demoId> --stdin
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const id = process.argv[2]
if (!id) {
  console.error(
    'usage: node scripts/save-cdp-cover.mjs <demoId> [--file path] [--stdin]',
  )
  process.exit(1)
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
  return null
}

async function readStdin() {
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

let dataUrl = null
const fileIdx = process.argv.indexOf('--file')
if (process.argv.includes('--stdin')) {
  dataUrl = extractDataUrl(await readStdin())
} else if (fileIdx >= 0 && process.argv[fileIdx + 1]) {
  dataUrl = extractDataUrl(readFileSync(process.argv[fileIdx + 1], 'utf8'))
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
const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
const out = join('public', 'covers', `${id}.png`)
writeFileSync(out, buf)
console.log('wrote', out, buf.length)
