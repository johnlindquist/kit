export let applescript = async script =>
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`)
