export let applescript = async script => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  return exec(`osascript -e '${formattedScript}'`)
    .toString()
    .trim()
}
