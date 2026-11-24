import { describe, expect, it } from 'vitest'
import {
  COURSE_PACK_V1,
  courseNeighbors,
  flattenCourseDemoIds,
  resolveLessonDemos,
} from './coursePack'

describe('coursePack', () => {
  it('has multiple chapters and lessons', () => {
    expect(COURSE_PACK_V1.length).toBeGreaterThanOrEqual(5)
    expect(COURSE_PACK_V1.every((c) => c.lessons.length > 0)).toBe(true)
  })

  it('flattens unique-enough sequence', () => {
    const ids = flattenCourseDemoIds()
    expect(ids.length).toBeGreaterThan(40)
    expect(ids).toContain('mech-projectile')
    expect(ids).toContain('nuclear-decay')
  })

  it('resolves neighbors within live set', () => {
    const live = new Set(['mech-projectile', 'mech-circular', 'mech-natural-frame'])
    const n = courseNeighbors('mech-circular', live)
    expect(n.prev).toBe('mech-projectile')
    expect(n.next).toBe('mech-natural-frame')
    expect(n.lessonTitle).toContain('运动学')
  })

  it('filters missing demos from lesson', () => {
    const live = new Set(['mech-projectile'])
    const lesson = COURSE_PACK_V1[0]!.lessons[0]!
    expect(resolveLessonDemos(lesson, live)).toEqual(['mech-projectile'])
  })
})
