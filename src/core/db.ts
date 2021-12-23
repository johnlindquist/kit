import * as path from "path"
import {
  appDbPath,
  kitPath,
  kenvPath,
  mainScriptPath,
  prefsPath,
  promptDbPath,
  shortcutsPath,
  isDir,
  extensionRegex,
  resolveScriptToCommand,
  parseScripts,
  isMac,
} from "./utils.js"
import { Choice, Script, PromptDb } from "../types/core"
import {
  Low,
  JSONFile,
} from "@johnlindquist/kit-internal/lowdb"

export const resolveKenv = (...parts: string[]) => {
  if (global.kitScript) {
    return path.resolve(
      global.kitScript,
      "..",
      "..",
      ...parts
    )
  }

  return kenvPath(...parts)
}

export let db = async (
  key: any,
  defaults?: any,
  fromCache = true
): Promise<Low & any> => {
  if (
    typeof defaults === "undefined" &&
    typeof key !== "string"
  ) {
    defaults = key
    key = "_" + resolveScriptToCommand(global.kitScript)
  }
  if (typeof defaults === "undefined") defaults = {}

  let dbPath = key
  if (!key.endsWith(".json")) {
    dbPath = resolveKenv("db", `${key}.json`)
  }

  let parentExists = await isDir(path.dirname(dbPath))
  if (!parentExists) {
    console.warn(
      `Couldn't find ${path.dirname(
        dbPath
      )}. Returning defaults...`
    )
    return {
      ...defaults,
      write: () => {},
    }
  }

  let _db = new Low(new JSONFile(dbPath))

  await _db.read()

  if (!_db.data || !fromCache) {
    let getData = async () => {
      if (typeof defaults === "function") {
        let data = await defaults()
        if (Array.isArray(data)) return { items: data }

        return data
      }

      if (Array.isArray(defaults))
        return { items: defaults }

      return defaults
    }

    _db.data = await getData()

    await _db.write()
  }

  return new Proxy({} as any, {
    get: (_target, k: string) => {
      if (k === "then") return _db
      let d = _db as any
      if (d[k]) {
        return typeof d[k] === "function"
          ? d[k].bind(d)
          : d[k]
      }
      return _db?.data?.[k]
    },
    set: (target: any, key: string, value: any) => {
      try {
        ;(_db as any).data[key] = value
        return true
      } catch (error) {
        return false
      }
    },
  })
}

global.db = db

export let getScriptsDb = async (
  fromCache = true
): Promise<{
  scripts: Script[]
}> => {
  // if (!fromCache) console.log(`🔄 Refresh scripts db`)
  return await db(
    kitPath("db", "scripts.json"),
    async () => ({
      scripts: await parseScripts(),
    }),
    fromCache
  )
}

export let refreshScriptsDb = async () => {
  await getScriptsDb(false)
}

export let getPrefs = async () => {
  return await db(kitPath("db", "prefs.json"))
}

export let getScriptFromString = async (
  script: string
): Promise<Script> => {
  let { scripts } = await getScriptsDb()

  if (!script.includes(path.sep)) {
    let result = scripts.find(
      s =>
        s.name === script ||
        s.command === script.replace(extensionRegex, "")
    )

    if (!result) {
      throw new Error(
        `Cannot find script based on name or command: ${script}`
      )
    }

    return result
  }

  if (script.startsWith(path.sep)) {
    let result = scripts.find(s => s.filePath === script)

    if (!result) {
      throw new Error(
        `Cannot find script based on path: ${script}`
      )
    }

    return result
  }

  throw new Error(
    `Cannot find script: ${script}. Input should either be the "command-name" of the "/path/to/the/script"`
  )
}

export let getScripts = async (fromCache = true) =>
  (await getScriptsDb(fromCache)).scripts
export interface ScriptValue {
  (pluck: keyof Script, fromCache?: boolean): () => Promise<
    Choice<string>[]
  >
}

export let scriptValue: ScriptValue =
  (pluck, fromCache) => async () => {
    let menuItems: Script[] = await getScripts(fromCache)

    return menuItems.map((script: Script) => ({
      ...script,
      value: script[pluck],
    }))
  }

type AppDb = {
  needsRestart: boolean
  version: string
  openAtLogin: boolean
  previewScripts: boolean
  autoUpdate: boolean
  tray: boolean
}

export const appDefaults = {
  needsRestart: false,
  version: "0.0.0",
  autoUpdate: true,
  tray: true,
  openAtLogin: true,
}

export let getAppDb = async (): Promise<
  Low<any> & AppDb
> => {
  return await db(appDbPath, appDefaults)
}

type ShortcutsDb = {
  shortcuts: {
    [key: string]: string
  }
}
export let getShortcutsDb = async (): Promise<
  Low<any> & ShortcutsDb
> => {
  return await db(shortcutsPath, {
    shortcuts: {
      [mainScriptPath]: isMac ? "cmd ;" : "ctrl ;",
    },
  })
}

type PrefsDb = {
  showJoin: boolean
}
export let getPrefsDb = async (): Promise<
  Low<any> & PrefsDb
> => {
  return await db(prefsPath, { showJoin: true })
}

export let getPromptDb = async (): Promise<
  Low<any> & PromptDb
> => {
  return await db(promptDbPath, {
    screens: {},
    clear: false,
  })
}
