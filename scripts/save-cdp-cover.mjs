import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const id = process.argv[2]
if (!id) {
  console.error('usage: node scripts/save-cdp-cover.mjs <demoId>')
  process.exit(1)
}

const logDir = 'C:/Users/Administrator/.cursor/browser-logs'
const files = readdirSync(logDir)
  .filter((f) => f.startsWith('cdp-response-Runtime.evaluate-') && f.endsWith('.json'))
  .map((f) => ({ f, t: statSync(join(logDir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)

const latest = files[0]
if (!latest) {
  console.error('no cdp response')
  process.exit(1)
}

const j = JSON.parse(readFileSync(join(logDir, latest.f), 'utf8'))
const s = j.result?.result?.value ?? j.result?.value ?? j.value
if (typeof s !== 'string' || !s.startsWith('data:image')) {
  console.error('no data url in', latest.f)
  process.exit(1)
}
const buf = Buffer.from(s.split(',')[1], 'base64')
const out = join('public', 'covers', `${id}.png`)
writeFileSync(out, buf)
console.log('wrote', out, buf.length, 'from', latest.f)
