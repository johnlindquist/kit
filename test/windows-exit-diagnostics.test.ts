import ava from "ava"

// Windows-only diagnostics to trace unexpected process exits
const isWindows = process.platform === "win32"

// Guard to avoid double-installing listeners in watch/debug
let installed = false

if (isWindows && !installed) {
  installed = true

  const originalExit = process.exit.bind(process)

  // Log when process.exit is invoked, with a stack for the caller
  // Do not swallow the exit — re-call the original after logging
  // AVA will still control overall exit, we just add breadcrumbs
  // eslint-disable-next-line no-global-assign
  ;(process as any).exit = (code?: number) => {
    const stack = new Error("process.exit caller trace").stack || "(no stack)"
    // eslint-disable-next-line no-console
    console.error(
      `[diagnostics] process.exit called with code=${code}\n${stack}`
    )
    return originalExit(code as any)
  }

  process.on("beforeExit", (code) => {
    // eslint-disable-next-line no-console
    console.error(
      `[diagnostics] beforeExit code=${code} exitCode=${process.exitCode}`
    )
  })

  process.on("exit", (code) => {
    // eslint-disable-next-line no-console
    console.error(
      `[diagnostics] exit code=${code} exitCode=${process.exitCode}`
    )
  })

  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("[diagnostics] uncaughtException:", err?.stack || String(err))
  })

  process.on("unhandledRejection", (reason, promise) => {
    // eslint-disable-next-line no-console
    console.error(
      "[diagnostics] unhandledRejection reason:",
      (reason as any)?.stack || String(reason)
    )
  })

  process.on("warning", (warning) => {
    // eslint-disable-next-line no-console
    console.error(
      `[diagnostics] process warning: ${warning.name}: ${warning.message}\n${warning.stack}`
    )
  })
}

// A trivial test to ensure this file runs in CI and emits diagnostics
ava("windows exit diagnostics active", (t) => {
  t.pass()
})

ava.after.always("windows handle summary", () => {
  if (!isWindows) return
  const getHandles = (process as any)._getActiveHandles?.bind(process)
  const getRequests = (process as any)._getActiveRequests?.bind(process)
  const handles = getHandles ? getHandles() : []
  const requests = getRequests ? getRequests() : []
  // eslint-disable-next-line no-console
  console.error(
    `[diagnostics] active handles=${handles.length} requests=${requests.length} handleTypes=${handles
      .map((h: any) => h?.constructor?.name || typeof h)
      .join(",")} `
  )
})
