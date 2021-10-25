import path from "path"
import { URL } from "url"

export let kit = async (
  command: string,
  ..._args: string[]
) => {
  process.env.KIT =
    process.env.KIT ||
    path.dirname(new URL(import.meta.url).pathname)

  await import("./api/global.js")
  await import("./api/kit.js")
  await import("./api/lib.js")
  await import("./target/terminal.js")

  return await global.run(command, ..._args)
}

let dirs = ["cli", "main"]

let kitGet = (
  _target: any,
  key: string,
  _receiver: any
) => {
  if ((global as any)[key] && !dirs.includes(key)) {
    return (global as any)[key]
  }

  try {
    return new Proxy(
      {},
      {
        get: async (_target, module: string, _receiver) => {
          let modulePath = `../${key}/${module}.js?${global.uuid()}`
          return await import(modulePath)
        },
      }
    )
  } catch (error) {
    console.warn(error)
  }
}

global.kit = new Proxy(kit, {
  get: kitGet,
})

export { selectKenv, selectScript } from "./core/utils.js"
//codegen
