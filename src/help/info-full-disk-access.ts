let html = md(`
## Browsing Files Requires Full Disk Access

Please verify "Full Disk Access" in your security preferences
`)

await div({
  html,
  ignoreBlur: true,
})

export {}
