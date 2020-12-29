let { applescript } = await import("./applescript.js")

export let iterm = command => {
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
  applescript(script)
}
