import { Channel } from "../core/enum.js"

global.getSelectedText = async () => {
  await global.hide()
  await sendWait(Channel.KEYBOARD_COPY)
  const result = await global.paste()
  if (result?.replace(/[\r\n]/g, "") === "") return ""
  return result
}

/**
 * Robust selected text retrieval with polling and optional clipboard restore.
 * Returns a structured result without changing existing getSelectedText.
 */
global.getSelectedTextEx = async (
  options?: {
    restoreClipboard?: boolean
    timeoutMs?: number
    pollMs?: number
  }
) => {
  const restore = options?.restoreClipboard !== false
  const timeoutMs = Number.isFinite(options?.timeoutMs) ? (options?.timeoutMs as number) : 1000
  const pollMs = Number.isFinite(options?.pollMs) ? (options?.pollMs as number) : 75

  const prev = await global.paste()
  await global.hide()
  await sendWait(Channel.KEYBOARD_COPY)

  const start = Date.now()
  let current = ""
  while (Date.now() - start < timeoutMs) {
    current = await global.paste()
    if (current && current !== prev) break
    await new Promise((r) => setTimeout(r, pollMs))
  }

  // Classify
  const value = current || ""
  const ok = Boolean(value)
  const reason = ok ? undefined : (prev ? "unchanged" : "no-selection")

  if (restore) {
    try {
      // Only restore if we actually changed the clipboard and we still hold that value
      if (ok && (await global.paste()) === value) {
        await global.copy(prev)
      }
    } catch {
      // ignore restore errors
    }
  }

  return { ok, value, reason }
}

/**
@param text - A String to Paste at the Cursor
@example
```
await setSelectedText(`Script Kit is awesome!`)
```
*/

global.setSelectedText = async (
  text: string = "",
  options?: boolean | { hide?: boolean; method?: "typing" | "clipboard" | "auto" }
) => {
  // Back-compat: second param as boolean means hide
  const hide = typeof options === "boolean" ? options : options?.hide !== false
  const method = typeof options === "object" ? options?.method : undefined
  if (hide) await global.hide()
  return await sendWait(Channel.SET_SELECTED_TEXT, { text, hide, method })
}

global.cutText = () => sendWait(Channel.CUT_TEXT)

export {}
