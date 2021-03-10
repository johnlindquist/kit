export let getSelectedText = async () => {
  send("HIDE_APP")
  
  await applescript(
    String.raw`tell application "System Events" to keystroke "c" using command down`
  )

  let selectedText = await applescript(
    String.raw`get the clipboard`
  )

  return selectedText.trim()
}

export let setSelectedText = async text => {
  await applescript(
    String.raw`set the clipboard to "${text.replaceAll(
      '"',
      '\\"'
    )}"`
  )
  send("HIDE_APP")

  await applescript(
    String.raw`tell application "System Events" to keystroke "v" using command down`
  )
}
