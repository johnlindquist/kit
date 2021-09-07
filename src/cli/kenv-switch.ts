import { Channel } from "../core/enum.js"

let kitAppDb = await db(kitPath("db", "app.json"))

let kenv = await arg(
  {
    placeholder: `Select kenv`,
    hint: `Current Kenv: ${process.env.KENV}`,
  },
  kitAppDb.KENVS
)

global.send(Channel.SWITCH_KENV, { kenvPath: kenv })

export {}
