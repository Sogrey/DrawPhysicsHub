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
    expect(items.some((i) => i.subject === '电磁学' && i.status === 'soon')).toBe(true)
    const tree = buildDemoTree(items)
    expect(tree[0]?.subject).toBe('力学')
    expect(tree.map((s) => s.subject)).toContain('光学')
  })

  it('filters by query / tag / subject', () => {
    const items = buildCatalogItems(live)
    expect(filterCatalog(items, { q: '抛体' }).some((d) => d.id === 'mech-projectile')).toBe(true)
    expect(filterCatalog(items, { subject: '电磁学' }).every((d) => d.subject === '电磁学')).toBe(
      true,
    )
  })
})
