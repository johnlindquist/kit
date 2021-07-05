import { db as _db } from "kit-bridge/esm/db"
import { resolveScriptToCommand } from "kit-bridge/esm/util"

global.db = async (
  key: any,
  defaults,
  fromCache = true
) => {
  if (
    typeof defaults === "undefined" &&
    typeof key !== "string"
  ) {
    defaults = key
    key = "_" + resolveScriptToCommand(global.kitScript)
  }

  return await _db(key, defaults, fromCache)
}

export {}
