/** WebWorker 数值管线消息协议（M7-16） */

export type WorkerRequest =
  | { type: 'ping'; id: number }
  | {
      type: 'rutherfordStep'
      id: number
      b: number
      v0: number
      soft: number
      dt: number
      steps: number
    }

export type WorkerResponse =
  | { type: 'pong'; id: number }
  | {
      type: 'rutherfordResult'
      id: number
      xs: Float32Array
      ys: Float32Array
      n: number
      theta: number
    }
  | { type: 'error'; id: number; message: string }
