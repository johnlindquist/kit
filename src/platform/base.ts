import os from "os"

let unsupported = () => {
  let stack = new Error().stack
  // N.B. stack === "Error\n  at Hello ...\n  at main ... \n...."
  let m = stack.match(/.*?unsupported.*?\n(.*?)\n/)
  if (m) {
    let fnName = m[1]
    throw new Error(
      `${fnName} is unsupported on ${os.platform()}`
    )
  }
}

global.applescript = async (
  script,
  options = { silent: true }
) => {
  unsupported()

  return ""
}

global.terminal = async script => {
  unsupported()

  return ""
}

global.iterm = async command => {
  unsupported()

  return ""
}

global.selectKitEditor = async (reset = false) => {
  unsupported()

  return ""
}

global.edit = async (file, dir, line = 0, col = 0) => {
  unsupported()

  return
}

global.browse = async url => {
  unsupported()

  return
}

global.openLog = () => {
  unsupported()

  return ""
}
