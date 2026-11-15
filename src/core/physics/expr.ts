/** Restricted arithmetic expression evaluator (M1-08) — no arbitrary JS */

const ALLOWED = new Set([
  'abs',
  'sqrt',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'exp',
  'log',
  'log10',
  'pow',
  'min',
  'max',
  'PI',
  'E',
])

const FN: Record<string, (...args: number[]) => number> = {
  abs: Math.abs,
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  exp: Math.exp,
  log: Math.log,
  log10: Math.log10,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' }

function tokenize(src: string): Token[] {
  const s = src.replace(/\s+/g, '')
  const out: Token[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]!
    if ((c >= '0' && c <= '9') || c === '.') {
      let j = i + 1
      while (j < s.length && ((s[j]! >= '0' && s[j]! <= '9') || s[j] === '.' || s[j] === 'e' || s[j] === 'E')) {
        if ((s[j] === 'e' || s[j] === 'E') && (s[j + 1] === '+' || s[j + 1] === '-')) j += 2
        else j++
      }
      out.push({ t: 'num', v: Number(s.slice(i, j)) })
      i = j
      continue
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      let j = i + 1
      while (
        j < s.length &&
        ((s[j]! >= 'a' && s[j]! <= 'z') ||
          (s[j]! >= 'A' && s[j]! <= 'Z') ||
          (s[j]! >= '0' && s[j]! <= '9') ||
          s[j] === '_')
      )
        j++
      out.push({ t: 'id', v: s.slice(i, j) })
      i = j
      continue
    }
    if ('+-*/^'.includes(c)) {
      out.push({ t: 'op', v: c })
      i++
      continue
    }
    if (c === '(') {
      out.push({ t: 'lp' })
      i++
      continue
    }
    if (c === ')') {
      out.push({ t: 'rp' })
      i++
      continue
    }
    if (c === ',') {
      out.push({ t: 'comma' })
      i++
      continue
    }
    throw new Error(`非法字符: ${c}`)
  }
  return out
}

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 }

function toRpn(tokens: Token[]): Token[] {
  const out: Token[] = []
  const stack: Token[] = []
  let prev: Token | undefined
  for (const tok of tokens) {
    if (tok.t === 'num' || (tok.t === 'id' && (tok.v === 'PI' || tok.v === 'E'))) {
      out.push(tok)
    } else if (tok.t === 'id' && tok.v in FN) {
      stack.push(tok)
    } else if (tok.t === 'id') {
      // variable — validated by caller against env / ALLOWED
      out.push(tok)
    } else if (tok.t === 'op') {
      // unary minus
      let op = tok.v
      if (op === '-' && (!prev || prev.t === 'op' || prev.t === 'lp' || prev.t === 'comma')) {
        out.push({ t: 'num', v: 0 })
      }
      while (stack.length) {
        const top = stack[stack.length - 1]!
        if (top.t === 'op' && PREC[top.v]! >= PREC[op]!) out.push(stack.pop()!)
        else if (top.t === 'id') out.push(stack.pop()!)
        else break
      }
      stack.push({ t: 'op', v: op })
    } else if (tok.t === 'lp') {
      stack.push(tok)
    } else if (tok.t === 'comma') {
      while (stack.length && stack[stack.length - 1]!.t !== 'lp') out.push(stack.pop()!)
    } else if (tok.t === 'rp') {
      while (stack.length && stack[stack.length - 1]!.t !== 'lp') out.push(stack.pop()!)
      if (!stack.length) throw new Error('括号不匹配')
      stack.pop()
      if (stack.length && stack[stack.length - 1]!.t === 'id') out.push(stack.pop()!)
    }
    prev = tok
  }
  while (stack.length) {
    const t = stack.pop()!
    if (t.t === 'lp' || t.t === 'rp') throw new Error('括号不匹配')
    out.push(t)
  }
  return out
}

function evalRpn(rpn: Token[], env: Record<string, number>): number {
  const st: number[] = []
  for (const tok of rpn) {
    if (tok.t === 'num') st.push(tok.v)
    else if (tok.t === 'id' && tok.v === 'PI') st.push(Math.PI)
    else if (tok.t === 'id' && tok.v === 'E') st.push(Math.E)
    else if (tok.t === 'id' && tok.v in env) st.push(env[tok.v]!)
    else if (tok.t === 'id' && tok.v in FN) {
      const fn = FN[tok.v]!
      if (tok.v === 'atan2' || tok.v === 'pow' || tok.v === 'min' || tok.v === 'max') {
        const b = st.pop()
        const a = st.pop()
        if (a === undefined || b === undefined) throw new Error('参数不足')
        st.push(fn(a, b))
      } else {
        const a = st.pop()
        if (a === undefined) throw new Error('参数不足')
        st.push(fn(a))
      }
    } else if (tok.t === 'op') {
      const b = st.pop()
      const a = st.pop()
      if (a === undefined || b === undefined) throw new Error('运算符缺操作数')
      switch (tok.v) {
        case '+':
          st.push(a + b)
          break
        case '-':
          st.push(a - b)
          break
        case '*':
          st.push(a * b)
          break
        case '/':
          st.push(a / b)
          break
        case '^':
          st.push(Math.pow(a, b))
          break
        default:
          throw new Error(`未知运算符 ${tok.v}`)
      }
    } else {
      throw new Error(`未知标识符 ${tok.t === 'id' ? tok.v : ''}`)
    }
  }
  if (st.length !== 1) throw new Error('表达式无效')
  return st[0]!
}

/** Evaluate a restricted math expression with optional variable env. */
export function evalExpr(source: string, env: Record<string, number> = {}): number {
  for (const k of Object.keys(env)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) throw new Error(`非法变量名: ${k}`)
  }
  const tokens = tokenize(source)
  // allow env vars in ALLOWED check via id path in evalRpn
  const rpn = toRpn(
    tokens.map((tok) => {
      if (tok.t === 'id' && tok.v in env) return tok
      if (tok.t === 'id' && !ALLOWED.has(tok.v) && !(tok.v in env)) {
        throw new Error(`不允许的标识符: ${tok.v}`)
      }
      return tok
    }),
  )
  return evalRpn(rpn, env)
}
