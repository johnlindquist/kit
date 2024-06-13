import { isMac } from "./platform.js"

//app
export const shortcutNormalizer = (shortcut: string) =>
  shortcut
    ? shortcut
      .replace(
        /(option|opt|alt)/i,
        isMac ? "Option" : "Alt"
      )
      .replace(/(ctl|cntrl|ctrl|control)/, "Control")
      .replace(
        /(command|cmd)/i,
        isMac ? "Command" : "Control"
      )
      .replace(/(shift|shft)/i, "Shift")
      .split(/\s/)
      .filter(Boolean)
      .map(part =>
        (part[0].toUpperCase() + part.slice(1)).trim()
      )
      .join("+")
    : ""

export const friendlyShortcut = (shortcut: string) => {
  let f = ""
  if (shortcut.includes("Command+")) f += "cmd+"
  if (shortcut.match(/(?<!Or)Control\+/)) f += "ctrl+"
  if (shortcut.includes("Alt+")) f += "alt+"
  if (shortcut.includes("Option+")) f += "opt+"
  if (shortcut.includes("Shift+")) f += "shift+"
  if (shortcut.includes("+"))
    f += shortcut.split("+").pop()?.toLowerCase()

  return f
}