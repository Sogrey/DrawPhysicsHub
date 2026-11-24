import type { WorkerRequest, WorkerResponse } from './protocol'

type Pending = {
  resolve: (v: WorkerResponse) => void
  reject: (e: Error) => void
}

/**
 * 轻量 Worker 客户端：按请求 id 匹配响应。
 * 主线程卡顿敏感的数值（α 散射等）走此管线。
 */
export class SimWorkerClient {
  private worker: Worker | null = null
  private seq = 1
  private pending = new Map<number, Pending>()

  start(): void {
    if (this.worker) return
    this.worker = new Worker(new URL('./sim.worker.ts', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const msg = ev.data
      const p = this.pending.get(msg.id)
      if (!p) return
      this.pending.delete(msg.id)
      if (msg.type === 'error') p.reject(new Error(msg.message))
      else p.resolve(msg)
    }
    this.worker.onerror = (err) => {
      for (const [, p] of this.pending) p.reject(new Error(String(err.message)))
      this.pending.clear()
    }
  }

  stop(): void {
    this.worker?.terminate()
    this.worker = null
    for (const [, p] of this.pending) p.reject(new Error('worker stopped'))
    this.pending.clear()
  }

  request(msg: Omit<WorkerRequest, 'id'> & { id?: number }, timeoutMs = 8000): Promise<WorkerResponse> {
    this.start()
    const id = msg.id ?? this.seq++
    const full = { ...msg, id } as WorkerRequest
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error('worker timeout'))
      }, timeoutMs)
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer)
          resolve(v)
        },
        reject: (e) => {
          clearTimeout(timer)
          reject(e)
        },
      })
      this.worker!.postMessage(full)
    })
  }
}

/** 主线程同步后备（测试 / Worker 不可用时） */
export function rutherfordOrbitSync(
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
    vx += x * inv * dt
    vy += y * inv * dt
    x += vx * dt
    y += vy * dt
    if (x > 10 && i > 20) {
      return { xs: xs.subarray(0, i + 1), ys: ys.subarray(0, i + 1), n: i + 1, theta: Math.atan2(vy, vx) }
    }
  }
  return { xs, ys, n: steps, theta: Math.atan2(vy, vx) }
}
