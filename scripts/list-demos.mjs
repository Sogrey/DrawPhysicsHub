/**
 * M6-02：从源码扫描已注册演示，生成 docs/演示清单.md，
 * 并与 LIVE_COVERS / capture-covers ALL_DEMOS 交叉核对。
 *
 * 用法：node scripts/list-demos.mjs
 * 包脚本：pnpm list:demos
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const demosRoot = join(root, 'src', 'demos')
const outPath = join(root, 'docs', '演示清单.md')
const catalogPath = join(root, 'src', 'app', 'catalog', 'catalogPlan.ts')
/** 封面抓取清单（与 capture-covers / save-cdp-cover 共用） */
const capturePath = join(root, 'scripts', 'cover-demos.mjs')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (name.endsWith('.ts')) acc.push(p)
  }
  return acc
}

function parseMeta(file) {
  const base = file.replace(/\\/g, '/').split('/').pop()
  if (!base) return null
  if (
    base.endsWith('.spec.ts') ||
    /Adapter\.ts$/i.test(base) ||
    /^render/i.test(base) ||
    base === 'index.ts'
  ) {
    return null
  }
  const src = readFileSync(file, 'utf8')
  // DemoMeta 块通常含 id / subject / category，且 docs.title
  const id = src.match(/\bid:\s*'([^']+)'/)?.[1]
  const subject = src.match(/\bsubject:\s*'([^']+)'/)?.[1]
  const category = src.match(/\bcategory:\s*'([^']+)'/)?.[1]
  const title =
    src.match(/docs:\s*\{[\s\S]*?\btitle:\s*'([^']+)'/)?.[1] ??
    src.match(/\btitle:\s*'([^']+)'/)?.[1]
  if (!id || !subject || !category) return null
  // 排除 challenge / view 等杂 id（须像 mech- / em- / opt- …）
  if (!/^(mech|em|opt|thermo|qm|theo)-/.test(id)) return null
  return {
    id,
    subject,
    category,
    title: title ?? id,
    file: relative(root, file).replace(/\\/g, '/'),
  }
}

const SUBJECT_ORDER = ['力学', '电磁学', '光学', '热学', '量子力学', '理论力学']

const demos = walk(demosRoot)
  .map(parseMeta)
  .filter(Boolean)
  .sort((a, b) => {
    const si = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject)
    if (si !== 0) return si
    return a.id.localeCompare(b.id)
  })

// 去重（同一 id 只留一条）
const byId = new Map()
for (const d of demos) byId.set(d.id, d)
const unique = [...byId.values()]

const catalogSrc = readFileSync(catalogPath, 'utf8')
const coverIds = [...catalogSrc.matchAll(/'([^']+)':\s*'\/covers\//g)].map((m) => m[1])
const coverSet = new Set(coverIds)

const captureSrc = readFileSync(capturePath, 'utf8')
const captureIds = [...captureSrc.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1])
const captureSet = new Set(captureIds)

const missingCover = unique.filter((d) => !coverSet.has(d.id)).map((d) => d.id)
const missingCapture = unique.filter((d) => !captureSet.has(d.id)).map((d) => d.id)
const orphanCover = coverIds.filter((id) => !byId.has(id))
const orphanCapture = captureIds.filter((id) => !byId.has(id))

const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
const counts = {}
for (const d of unique) counts[d.subject] = (counts[d.subject] ?? 0) + 1

const lines = [
  '# 演示清单（自动生成）',
  '',
  `> 由 \`pnpm list:demos\`（\`scripts/list-demos.mjs\`）生成 · ${now}`,
  `> 源：\`src/demos/**\` DemoMeta；交叉核对 \`LIVE_COVERS\` / \`capture-covers.mjs\`。`,
  '',
  `**合计：${unique.length}**`,
  '',
  '| 学科 | 数量 |',
  '|------|------|',
  ...SUBJECT_ORDER.filter((s) => counts[s]).map((s) => `| ${s} | ${counts[s]} |`),
  '',
  '## 明细',
  '',
  '| id | 学科 | 分类 | 标题 | 源文件 | 封面 |',
  '|----|------|------|------|--------|------|',
  ...unique.map((d) => {
    const cov = coverSet.has(d.id) ? '✅' : '❌'
    return `| \`${d.id}\` | ${d.subject} | ${d.category} | ${d.title} | \`${d.file}\` | ${cov} |`
  }),
  '',
  '## 交叉核对',
  '',
  missingCover.length
    ? `- ❌ LIVE_COVERS 缺：${missingCover.map((x) => `\`${x}\``).join(', ')}`
    : '- ✅ LIVE_COVERS 与清单一致',
  missingCapture.length
    ? `- ❌ capture-covers 缺：${missingCapture.map((x) => `\`${x}\``).join(', ')}`
    : '- ✅ capture-covers ALL_DEMOS 与清单一致',
  orphanCover.length
    ? `- ⚠ LIVE_COVERS 多余：${orphanCover.map((x) => `\`${x}\``).join(', ')}`
    : '- ✅ 无多余 LIVE_COVERS',
  orphanCapture.length
    ? `- ⚠ capture-covers 多余：${orphanCapture.map((x) => `\`${x}\``).join(', ')}`
    : '- ✅ 无多余 capture 条目',
  '',
  '---',
  '',
  '*勿手改本文件正文；改演示后重跑 `pnpm list:demos`。*',
  '',
]

writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(`list-demos: ${unique.length} demos → ${relative(root, outPath)}`)
if (missingCover.length || missingCapture.length) {
  console.warn('list-demos: 存在封面/截图清单缺口，见上方输出')
  process.exitCode = 1
}
