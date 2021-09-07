import { db as _db } from "../../core/db.js"
import { resolveScriptToCommand } from "../../core/util.js"

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
