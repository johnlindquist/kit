export let lock = async () => {
  return await applescript(
    String.raw`tell application "System Events" to keystroke "q" using {command down, control down}`
  )
}
