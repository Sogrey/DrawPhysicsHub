/**
 * M8 进阶扩包抽检：封面齐全性 + theo/math/rel/课次/目录单测，刷新 docs/M8抽检报告.md。
 * 用法：pnpm audit:m8  或  node scripts/audit-m8.mjs
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  M8A_COVER_IDS,
  M8B_COVER_IDS,
  M8C_COVER_IDS,
  M8D_COVER_IDS,
  M8REL_COVER_IDS,
  M8F_MECH_COVER_IDS,
  M8F_EM_COVER_IDS,
  M8F_OTQ_COVER_IDS,
  M8F_REST_COVER_IDS,
  COVER_DEMOS,
} from './cover-demos.mjs'

const root = process.cwd()
const reportPath = join(root, 'docs', 'M8抽检报告.md')
const coversDir = join(root, 'public', 'covers')

const M8_IDS = [
  ...M8A_COVER_IDS,
  ...M8B_COVER_IDS,
  ...M8C_COVER_IDS,
  ...M8D_COVER_IDS,
  ...M8REL_COVER_IDS,
  ...M8F_MECH_COVER_IDS,
  ...M8F_EM_COVER_IDS,
  ...M8F_OTQ_COVER_IDS,
  ...M8F_REST_COVER_IDS,
]
const uniqueIds = [...new Set(M8_IDS)]

const coverDemoSet = new Set(COVER_DEMOS.map((d) => d.id))
const missingInCoverList = uniqueIds.filter((id) => !coverDemoSet.has(id))
const missingPng = uniqueIds.filter((id) => !existsSync(join(coversDir, `${id}.png`)))

function countSpecs(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.spec.ts')).length
  } catch {
    return 0
  }
}

const theoSpecs = countSpecs(join(root, 'src', 'demos', 'theo'))
const mathSpecs = countSpecs(join(root, 'src', 'demos', 'math'))
const relSpecs = countSpecs(join(root, 'src', 'demos', 'rel'))

let exitCode = 0
let output = ''
const vitestTargets = [
  'src/demos/theo',
  'src/demos/math',
  'src/demos/rel',
  'src/app/catalog/coursePack.spec.ts',
  'src/app/catalog/demoCatalog.spec.ts',
].join(' ')

try {
  output = execSync(`pnpm exec vitest run ${vitestTargets} --reporter=default`, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch (err) {
  exitCode = err.status ?? 1
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`
}

const passedMatch = output.match(/Test Files\s+(\d+) passed/)
const failedMatch = output.match(/Test Files\s+(\d+) failed/)
const testsPass = output.match(/Tests\s+(\d+) passed/)
const testsFail = output.match(/\|\s*(\d+) failed/)

const coverOk = missingPng.length === 0 && missingInCoverList.length === 0
if (!coverOk) exitCode = exitCode || 1

const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
const summary = [
  `**最近一次抽检：** ${now}（本地 vitest + 封面核对）`,
  '',
  `| 项 | 结果 |`,
  `|----|------|`,
  `| M8 演示 id 数 | ${uniqueIds.length}（A6+B6+C7+D19+Rel3+F27） |`,
  `| 封面 PNG | ${uniqueIds.length - missingPng.length}/${uniqueIds.length}${missingPng.length ? ` · 缺 ${missingPng.join(', ')}` : ''} |`,
  `| cover-demos 清单 | ${uniqueIds.length - missingInCoverList.length}/${uniqueIds.length}${missingInCoverList.length ? ` · 缺 ${missingInCoverList.join(', ')}` : ''} |`,
  `| theo / math / rel 单测文件 | ${theoSpecs} / ${mathSpecs} / ${relSpecs} |`,
  `| Test Files | ${passedMatch?.[1] ?? '?'} passed${failedMatch ? ` / ${failedMatch[1]} failed` : ''} |`,
  `| Tests | ${testsPass?.[1] ?? '?'} passed${testsFail ? ` / ${testsFail[1]} failed` : ''} |`,
  `| 退出码 | ${exitCode} |`,
  '',
  exitCode === 0
    ? '结论：**通过** — M8 封面齐全；理论/数理/近代 + 课次包/目录单测绿灯。'
    : '结论：**未通过** — 请查看 vitest / 封面缺失后重跑。',
].join('\n')

let report = readFileSync(reportPath, 'utf8')
const markerStart = '<!-- AUDIT_RUN_START -->'
const markerEnd = '<!-- AUDIT_RUN_END -->'
const block = `${markerStart}\n${summary}\n${markerEnd}`
if (report.includes(markerStart) && report.includes(markerEnd)) {
  report = report.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`), block)
} else {
  report = `${report.trimEnd()}\n\n## 自动抽检记录\n\n${block}\n`
}
writeFileSync(reportPath, report)

console.log(output)
if (missingPng.length) console.error('missing covers:', missingPng.join(', '))
if (missingInCoverList.length) console.error('missing COVER_DEMOS:', missingInCoverList.join(', '))
console.log(`\nUpdated ${reportPath}`)
process.exit(exitCode)
