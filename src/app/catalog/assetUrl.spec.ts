import { describe, expect, it } from 'vitest'
import { publicAsset } from './assetUrl'

describe('publicAsset', () => {
  it('joins path under current BASE_URL without double slashes', () => {
    const u = publicAsset('/covers/placeholder.svg')
    expect(u.endsWith('covers/placeholder.svg')).toBe(true)
    expect(u.includes('//covers')).toBe(false)
    // 开发/部署时 Vite base 为 /DrawPhysicsHub/；单测环境可能为 /
    expect(u.startsWith(import.meta.env.BASE_URL || '/')).toBe(true)
  })
})
