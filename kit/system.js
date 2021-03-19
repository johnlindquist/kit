export let lock = async () => {
  return await applescript(
    String.raw`tell application "System Events" to keystroke "q" using {command down, control down}`
  )
}

export let sleep = async () => {
  return await applescript(
    String.raw`tell application "Finder" to sleep`
  )
}

export let shutdown = async () => {
  return await applescript(
    String.raw`tell application "Finder" to shut down`
  )
}