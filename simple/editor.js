let terminalEditor = editor => async file => {
  let { possibleTerminals, ...macTerminals } = await simple(
    "terminal"
  )
  let terminal = await env("SIMPLE_TERMINAL", {
    message: `Which Terminal do you use with ${editor}?`,
    choices: possibleTerminals(),
  })

  return macTerminals[terminal](`${editor} ${file}`)
}

export let vim = terminalEditor("vim")
export let nano = terminalEditor("nano")

export let possibleEditors = () =>
  [
    "atom",
    "code",
    "emacs",
    "nano",
    "ne",
    "nvim",
    "sublime",
    "webstorm",
    "vim",
  ].filter(
    editor =>
      exec(
        `PATH="/usr/bin:/usr/local/bin" which ${editor}`,
        { silent: true }
      ).stdout
  )

export let code = async (file, dir, line = 0, col = 0) => {
  let codeArgs = ["--goto", `${file}:${line}:${col}`]
  if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
  codeArgs = codeArgs.join(" ")
  let command = `code ${codeArgs}`
  exec(command)
}
