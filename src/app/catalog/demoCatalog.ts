import type { DemoMeta } from '@/core/physics/types'
import { publicAsset } from './assetUrl'
import {
  CATEGORY_ORDER,
  LIVE_COVERS,
  PLACEHOLDER_COVER,
  PLANNED_SOON,
  SUBJECT_ORDER,
  type PlannedEntry,
} from './catalogPlan'

export interface CatalogItem {
  id: string
  subject: string
  category: string
  title: string
  summary?: string
  tags: string[]
  status: 'live' | 'soon'
  /** 封面 URL；live 无图时用分类占位 */
  cover?: string
  tone: string
}

export interface CatalogCategory {
  name: string
  items: CatalogItem[]
}

export interface CatalogSubject {
  subject: string
  categories: CatalogCategory[]
  items: CatalogItem[]
}

export interface CatalogFilter {
  q?: string
  tag?: string | null
  subject?: string | null
  /** 默认 true：目录含「敬请期待」；false 仅已实现 */
  includeSoon?: boolean
}

export function thumbTone(category: string, subject?: string): string {
  if (subject === '电磁学') {
    if (category.includes('静电')) return 'em'
    if (category.includes('磁')) return 'em'
    if (category.includes('洛伦兹') || category.includes('安培')) return 'em'
    if (category.includes('感应')) return 'em'
    return 'em'
  }
  if (subject === '光学') {
    if (category.includes('几何')) return 'optics'
    if (category.includes('干涉') || category.includes('衍射')) return 'optics'
    if (category.includes('偏振')) return 'optics'
    return 'optics'
  }
  if (subject === '热学') return 'thermo'
  if (subject === '量子力学') return 'qm'
  if (subject === '理论力学') return 'theo'
  if (category.includes('振动')) return 'osc'
  if (category.includes('刚体')) return 'rigid'
  if (category.includes('动量')) return 'momentum'
  if (category.includes('牛顿') || category.includes('斜面')) return 'force'
  if (category.includes('运动学')) return 'kino'
  if (category.includes('波动')) return 'wave'
  if (category.includes('势能') || category.includes('动能')) return 'energy'
  return 'default'
}

function categoryRank(subject: string, category: string): number {
  const order = CATEGORY_ORDER[subject]
  if (!order) return 1000
  const i = order.indexOf(category)
  return i >= 0 ? i : 500 + category.charCodeAt(0)
}

function fromMeta(d: DemoMeta): CatalogItem {
  const cover = LIVE_COVERS[d.id] ?? PLACEHOLDER_COVER
  return {
    id: d.id,
    subject: d.subject,
    category: d.category,
    title: d.docs.title,
    summary: d.docs.summary,
    tags: d.tags ?? [],
    status: 'live',
    cover: publicAsset(cover),
    tone: thumbTone(d.category, d.subject),
  }
}

function fromPlanned(p: PlannedEntry): CatalogItem {
  return {
    id: p.id,
    subject: p.subject,
    category: p.category,
    title: p.title,
    tags: p.tags ?? [],
    status: 'soon',
    cover: publicAsset(PLACEHOLDER_COVER),
    tone: thumbTone(p.category, p.subject),
  }
}

/** 已注册演示 + 规划中的「敬请期待」条目 */
export function buildCatalogItems(liveDemos: DemoMeta[]): CatalogItem[] {
  const liveIds = new Set(liveDemos.map((d) => d.id))
  const items = liveDemos.map(fromMeta)
  for (const p of PLANNED_SOON) {
    if (liveIds.has(p.id)) continue
    items.push(fromPlanned(p))
  }
  return items
}

function subjectRank(subject: string): number {
  const i = SUBJECT_ORDER.indexOf(subject as (typeof SUBJECT_ORDER)[number])
  return i >= 0 ? i : 100 + subject.charCodeAt(0)
}

export function buildDemoTree(items: CatalogItem[]): CatalogSubject[] {
  const bySubject = new Map<string, Map<string, CatalogItem[]>>()
  for (const d of items) {
    let cats = bySubject.get(d.subject)
    if (!cats) {
      cats = new Map()
      bySubject.set(d.subject, cats)
    }
    const list = cats.get(d.category) ?? []
    list.push(d)
    cats.set(d.category, list)
  }

  const subjects = [...bySubject.keys()].sort(
    (a, b) => subjectRank(a) - subjectRank(b) || a.localeCompare(b, 'zh'),
  )

  return subjects.map((subject) => {
    const cats = bySubject.get(subject)!
    const names = [...cats.keys()].sort(
      (a, b) =>
        categoryRank(subject, a) - categoryRank(subject, b) || a.localeCompare(b, 'zh'),
    )
    const categories = names.map((name) => ({
      name,
      items: [...(cats.get(name) ?? [])].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'live' ? -1 : 1
        return a.title.localeCompare(b.title, 'zh')
      }),
    }))
    const items = categories.flatMap((c) => c.items)
    return { subject, categories, items }
  })
}

export function filterCatalog(items: CatalogItem[], filter: CatalogFilter): CatalogItem[] {
  const q = (filter.q ?? '').trim().toLowerCase()
  const tag = filter.tag?.trim() || null
  const subject = filter.subject?.trim() || null
  const includeSoon = filter.includeSoon !== false

  return items.filter((d) => {
    if (!includeSoon && d.status === 'soon') return false
    if (subject && d.subject !== subject) return false
    if (tag && !d.tags.includes(tag)) return false
    if (!q) return true
    const hay = [d.id, d.subject, d.category, d.title, d.summary ?? '', ...d.tags]
      .join('\n')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function allSubjects(items: CatalogItem[]): string[] {
  return [...new Set(items.map((d) => d.subject))].sort(
    (a, b) => subjectRank(a) - subjectRank(b) || a.localeCompare(b, 'zh'),
  )
}

export function allTags(items: CatalogItem[]): string[] {
  const set = new Set<string>()
  for (const d of items) {
    for (const t of d.tags) set.add(t)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh'))
}

/** @deprecated use filterCatalog */
export const filterDemos = filterCatalog
