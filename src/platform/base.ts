import os from "os"
import { escapeShortcut } from "../core/utils.js"
import { PromptConfig } from "../types/core.js"

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

global.hyper = async command => {
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

global.openLog = () => {
  unsupported()

  return ""
}

global.find = async (config, options = {}) => {
  let defaultConfig = {
    placeholder: "Search Files",
    enter: "Select File",
    shortcuts: [escapeShortcut],
  }
  if (typeof config === "string") {
    defaultConfig.placeholder = config
  }

  let disabled = [
    {
      name: "Type at least 3 characters to search",
      disableSubmit: true,
    },
  ]

  let selectedFile = await arg(
    {
      ...defaultConfig,
      ...(config as PromptConfig),
    },
    async input => {
      if (!input || input === "undefined") {
        return disabled
      }
      if (input?.length < 3) {
        return disabled
      }

      let files = await fileSearch(input, options)
      return files.map(p => {
        return {
          name: path.basename(p),
          description: p,
          drag: p,
          value: p,
        }
      })
    }
  )

  return selectedFile
}
