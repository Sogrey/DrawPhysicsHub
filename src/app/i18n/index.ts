import { zh, type MessageKey } from './zh'

const messages = zh

/** 极薄 i18n：当前仅中文，后续可切换 locale */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let s: string = messages[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v))
    }
  }
  return s
}

export type { MessageKey }
