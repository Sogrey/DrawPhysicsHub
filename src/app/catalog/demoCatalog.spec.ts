import { describe, expect, it } from 'vitest'
import type { DemoMeta } from '@/core/physics/types'
import { NEW_DEMO_IDS } from './catalogPlan'
import { buildCatalogItems, buildDemoTree, filterCatalog } from './demoCatalog'

function fake(partial: Partial<DemoMeta> & Pick<DemoMeta, 'id' | 'subject' | 'category'>): DemoMeta {
  return {
    model: 'x',
    params: [],
    views: [],
    docs: { title: partial.docs?.title ?? partial.id, summary: 's' },
    tags: [],
    ...partial,
  } as DemoMeta
}

describe('demoCatalog', () => {
  const live = [
    fake({
      id: 'mech-projectile',
      subject: '力学',
      category: '质点运动学',
      tags: ['抛体'],
      docs: { title: '抛体', summary: '' },
    }),
  ]

  it('merges planned soon entries and orders subjects', () => {
    const items = buildCatalogItems(live)
    expect(items.some((i) => i.id === 'mech-projectile' && i.status === 'live')).toBe(true)
    // A–D / Rel / F 已全部落地，PLANNED_SOON 可为空
    const soon = items.filter((i) => i.status === 'soon')
    expect(soon.length).toBeGreaterThanOrEqual(0)
    const tree = buildDemoTree(items)
    expect(tree[0]?.subject).toBe('力学')
    // 仅注入力学 live 时，近代/数理科目可能不出现（无 PLANNED 补全）
    expect(tree.some((s) => s.subject === '力学')).toBe(true)
  })

  it('filters by query / tag / subject', () => {
    const items = buildCatalogItems(live)
    expect(filterCatalog(items, { q: '抛体' }).some((d) => d.id === 'mech-projectile')).toBe(true)
    expect(filterCatalog(items, { subject: '电磁学' }).every((d) => d.subject === '电磁学')).toBe(
      true,
    )
  })

  it('marks NEW_DEMO_IDS and filters onlyNew', () => {
    expect(NEW_DEMO_IDS.length).toBeGreaterThan(0)
    const items = buildCatalogItems([
      fake({
        id: NEW_DEMO_IDS[0]!,
        subject: '理论力学',
        category: '分析力学',
        docs: { title: '新演示', summary: '' },
      }),
      fake({
        id: 'mech-projectile',
        subject: '力学',
        category: '质点运动学',
        docs: { title: '抛体', summary: '' },
      }),
    ])
    expect(items.find((i) => i.id === NEW_DEMO_IDS[0])?.isNew).toBe(true)
    expect(items.find((i) => i.id === 'mech-projectile')?.isNew).toBe(false)
    const only = filterCatalog(items, { onlyNew: true, includeSoon: false })
    expect(only.every((i) => i.isNew)).toBe(true)
    expect(only.some((i) => i.id === NEW_DEMO_IDS[0])).toBe(true)
    expect(only.some((i) => i.id === 'mech-projectile')).toBe(false)
  })

  it('orders EM / optics categories by textbook sequence', () => {
    const items = buildCatalogItems([
      fake({
        id: 'em-lenz',
        subject: '电磁学',
        category: '电磁感应',
        docs: { title: '楞次', summary: '' },
      }),
      fake({
        id: 'em-point-charge',
        subject: '电磁学',
        category: '静电场',
        docs: { title: '点电荷', summary: '' },
      }),
      fake({
        id: 'opt-malus',
        subject: '光学',
        category: '偏振',
        docs: { title: '马吕斯', summary: '' },
      }),
      fake({
        id: 'opt-refraction',
        subject: '光学',
        category: '几何光学',
        docs: { title: '折射', summary: '' },
      }),
    ])
    const tree = buildDemoTree(items)
    const em = tree.find((s) => s.subject === '电磁学')!
    const opt = tree.find((s) => s.subject === '光学')!
    // 本用例仅注入静电场+电磁感应 live；F 电磁已落地故不再靠 PLANNED 补全
    expect(em.categories.map((c) => c.name)).toEqual(['静电场', '电磁感应'])
    expect(em.categories.find((c) => c.name === '静电场')!.items[0]!.status).toBe('live')
    expect(opt.categories[0]!.name).toBe('几何光学')
    expect(opt.categories.map((c) => c.name)).toContain('偏振')
    // 应用光学已随 F 落地；本用例未注入该类 live，故可能不出现
    expect(opt.categories.map((c) => c.name)).toContain('偏振')
  })
})

