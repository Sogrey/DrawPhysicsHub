import { describe, expect, it } from 'vitest'
import type { DemoMeta } from '@/core/physics/types'
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
    expect(items.some((i) => i.subject === '量子力学' && i.status === 'soon')).toBe(true)
    const tree = buildDemoTree(items)
    expect(tree[0]?.subject).toBe('力学')
    expect(tree.map((s) => s.subject)).toContain('量子力学')
  })

  it('filters by query / tag / subject', () => {
    const items = buildCatalogItems(live)
    expect(filterCatalog(items, { q: '抛体' }).some((d) => d.id === 'mech-projectile')).toBe(true)
    expect(filterCatalog(items, { subject: '电磁学' }).every((d) => d.subject === '电磁学')).toBe(
      true,
    )
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
    expect(em.categories.map((c) => c.name)).toEqual(['静电场', '电磁感应'])
    expect(em.categories.find((c) => c.name === '静电场')!.items[0]!.status).toBe('live')
    expect(opt.categories[0]!.name).toBe('几何光学')
    expect(opt.categories.map((c) => c.name)).toContain('偏振')
  })
})
