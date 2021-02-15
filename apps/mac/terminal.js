export let terminal = async script => {
  let command = `tell application "Terminal"
  do script "${script}"
  activate
  end tell
  `

  return await applescript(command)
}

export let iterm = async command => {
  command = `"${command.replace(/"/g, '\\"')}"`
  let script = `
    tell application "iTerm"
        if application "iTerm" is running then
            try
                tell the first window to create tab with default profile
            on error
                create window with default profile
            end try
        end if
    
        delay 0.1
    
        tell the first window to tell current session to write text ${command}
        activate
    end tell
    `.trim()
  return await applescript(script)
}

//TODO: Hyper? Other terminals?
let termMap = { terminal, iterm }

export let possibleTerminals = () =>
  Object.entries(termMap)
    .filter(async ([name, value]) => {
      return fileSearch(name, {
        onlyin: "/",
        kind: "application",
      })
    })
    .map(([name, value]) => ({ name, value: name }))
