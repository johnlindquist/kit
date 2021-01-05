export let applescript = async (script, options) => {
  let formattedScript = script.replace(/'/g, "'\"'\"'")
  return exec(`osascript -e '${formattedScript}'`, options)
    .toString()
    .trim()
}
