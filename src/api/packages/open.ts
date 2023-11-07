import { Open, OpenApp } from "../../types/packages"

let open: Open = async (target, options) => {
  let { default: _o } = await import("open")
  return _o(target, options)
}

let openApp: OpenApp = async (target, options) => {
  let { openApp } = await import("open")
  return openApp(target, options)
}

;(global as any).open = open
global.openApp = openApp

export {}
