import { Channel } from "../../core/enum.js"

let trash: typeof import("trash").default = (
  input,
  options
) => sendWait(Channel.TRASH, { input, options })

global.trash = trash
global.rm = trash

export {}
