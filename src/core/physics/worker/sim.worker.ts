/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from './protocol'

/**
 * 卢瑟福散射：库仑 1/r²（软化），从左侧入射，积分轨迹。
 * 教学单位：m=1、q1q2/(4πε0)=1。
 */
function rutherfordOrbit(
  b: number,
  v0: number,
  soft: number,
  dt: number,
  steps: number,
): { xs: Float32Array; ys: Float32Array; n: number; theta: number } {
  let x = -8
  let y = b
  let vx = Math.max(0.2, v0)
  let vy = 0
  const xs = new Float32Array(steps)
  const ys = new Float32Array(steps)
  const eps = Math.max(0.05, soft)
  for (let i = 0; i < steps; i++) {
    xs[i] = x
    ys[i] = y
    const r2 = x * x + y * y + eps * eps
    const r = Math.sqrt(r2)
    const inv = 1 / (r2 * r)
    const ax = x * inv
    const ay = y * inv
    vx += ax * dt
    vy += ay * dt
    x += vx * dt
    y += vy * dt
    if (x > 10 && i > 20) {
      const n = i + 1
      return {
        xs: xs.subarray(0, n),
        ys: ys.subarray(0, n),
        n,
        theta: Math.atan2(vy, vx),
      }
    }
  }
  return { xs, ys, n: steps, theta: Math.atan2(vy, vx) }
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data
  try {
    if (msg.type === 'ping') {
      const res: WorkerResponse = { type: 'pong', id: msg.id }
      self.postMessage(res)
      return
    }
    if (msg.type === 'rutherfordStep') {
      const out = rutherfordOrbit(msg.b, msg.v0, msg.soft, msg.dt, msg.steps)
      const res: WorkerResponse = {
        type: 'rutherfordResult',
        id: msg.id,
        xs: out.xs,
        ys: out.ys,
        n: out.n,
        theta: out.theta,
      }
      self.postMessage(res, [out.xs.buffer, out.ys.buffer])
      return
    }
  } catch (e) {
    const res: WorkerResponse = {
      type: 'error',
      id: (msg as { id: number }).id ?? -1,
      message: e instanceof Error ? e.message : String(e),
    }
    self.postMessage(res)
  }
}

export {}
