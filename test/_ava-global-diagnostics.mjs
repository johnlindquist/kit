// Loaded via AVA nodeArguments --import so it runs in each test process
const isWindows = process.platform === 'win32'
if (isWindows) {
  const pid = process.pid
  let installed = globalThis.__avaGlobalDiagInstalled
  if (!installed) {
    globalThis.__avaGlobalDiagInstalled = true

    const originalExit = process.exit.bind(process)
    process.exit = (code) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} process.exit called code=${code}`)
      return originalExit(code)
    }

    process.on('beforeExit', (code) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} beforeExit code=${code} exitCode=${process.exitCode}`)
    })

    process.on('exit', (code) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} exit code=${code} exitCode=${process.exitCode}`)
    })

    process.on('uncaughtException', (err) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} uncaughtException`, err?.stack || String(err))
    })

    process.on('unhandledRejection', (reason, promise) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} unhandledRejection`, (reason && reason.stack) || String(reason))
    })

    process.on('warning', (warning) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} warning ${warning.name}: ${warning.message}\n${warning.stack}`)
    })

    process.on('multipleResolves', (type, promise, value) => {
      // eslint-disable-next-line no-console
      console.error(`[ava-diag] pid=${pid} multipleResolves type=${type}`)
    })

    const getHandles = (process)._getActiveHandles?.bind(process)
    const getRequests = (process)._getActiveRequests?.bind(process)
    // Small delay to reduce noise; print snapshot near end of lifecycle
    setTimeout(() => {
      try {
        const handles = getHandles ? getHandles() : []
        const requests = getRequests ? getRequests() : []
        // eslint-disable-next-line no-console
        console.error(
          `[ava-diag] pid=${pid} snapshot handles=${handles.length} requests=${requests.length} types=${handles.map(h => h?.constructor?.name || typeof h).join(',')}`
        )
      } catch {}
    }, 1000)
  }
}

export {}

