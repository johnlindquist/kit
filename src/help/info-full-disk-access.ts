let html = md(`
## Browsing Files Requires Full Disk Access

Please verify "Full Disk Access" in your security preferences.

Once enabled, quit Kit.app from the menubar and restart it.
`)

await div({
  html,
  ignoreBlur: true,
})

export {}
