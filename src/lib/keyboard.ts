/**
 * @description Presses a keyboard shortcut
 * @param {string} application - the application form which this keyboard shortcut should be run
 * @param {string} key - a single key such as "j" or "q"
 * @typedef {('command'|'control'|'option')} Command - 'command' | 'control | 'option'
 * @param {Command[]} commands - an array of commands.
 * @example pressKeyboardShortcut("j", ["command", "control"]) would press `j + ⌘ + ^`
 */
export async function pressKeyboardShortcut(
  application = "",
  key = "",
  commands = []
) {
  // We want them as an array for formatCommands so we split on ","
  const formattedCommands = formatCommands(commands)
  // Note: we have to activate an application first in order to use this script with it
  // Otherwise, it will run the keyboard shortcut on Script Kit
  return await applescript(
    String.raw`
    activate application "${application}"
    tell application "System Events"
      keystroke "${key}" using {${formattedCommands}}
    end tell
    `
  )
}

function formatCommands(commands = []) {
  // This will turn ["control", "command"]
  // into this "control down, command down,"
  // and then slice the last commma
  return commands
    .map(command => `${command} down,`)
    .join(" ")
    .slice(0, -1)
}
