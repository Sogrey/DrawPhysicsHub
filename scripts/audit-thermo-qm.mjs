/**
 * 热学 / 量子包抽检：跑 thermo + qm 单测，刷新 docs/热学量子抽检报告.md。
 * 用法：node scripts/audit-thermo-qm.mjs
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const reportPath = join(root, 'docs', '热学量子抽检报告.md')
const thermoDir = join(root, 'src', 'demos', 'thermo')
const qmDir = join(root, 'src', 'demos', 'qm')

const specs = [
  ...readdirSync(thermoDir).filter((f) => f.endsWith('.spec.ts')),
  ...readdirSync(qmDir).filter((f) => f.endsWith('.spec.ts')),
].sort()

let exitCode = 0
let output = ''
try {
  output = execSync(
    'pnpm exec vitest run src/demos/thermo src/demos/qm --reporter=default',
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
} catch (err) {
  exitCode = err.status ?? 1
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`
}

const passedMatch = output.match(/Test Files\s+(\d+) passed/)
const failedMatch = output.match(/Test Files\s+(\d+) failed/)
const testsPass = output.match(/Tests\s+(\d+) passed/)
const testsFail = output.match(/\|\s*(\d+) failed/)

const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
const summary = [
  `**最近一次抽检：** ${now}（本地 vitest）`,
  '',
  `| 项 | 结果 |`,
  `|----|------|`,
  `| 单测文件数 | ${specs.length} |`,
  `| Test Files | ${passedMatch?.[1] ?? '?'} passed${failedMatch ? ` / ${failedMatch[1]} failed` : ''} |`,
  `| Tests | ${testsPass?.[1] ?? '?'} passed${testsFail ? ` / ${testsFail[1]} failed` : ''} |`,
  `| 退出码 | ${exitCode} |`,
  '',
  exitCode === 0
    ? '结论：**通过** — 热学 / 量子包数值/极限单测全部绿灯。'
    : '结论：**未通过** — 请查看 vitest 输出并修复后重跑。',
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
console.log(`\nUpdated ${reportPath}`)
process.exit(exitCode)
