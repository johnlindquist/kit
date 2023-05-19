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
  scriptsSort,
  scriptsDbPath,
  timestampsPath,
  userDbPath,
} from "./utils.js"
import { _ } from "@johnlindquist/globals"
import { Choice, Script, PromptDb } from "../types/core"
import {
  Low,
  JSONFile,
} from "@johnlindquist/kit-internal/lowdb"
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods"

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

export let db = async <T = any>(
  dataOrKeyOrPath?: string | T | (() => Promise<T>),
  data?: T | (() => Promise<T>),
  fromCache = true
): Promise<Low & any> => {
  if (
    typeof data === "undefined" &&
    typeof dataOrKeyOrPath !== "string"
  ) {
    data = dataOrKeyOrPath
    dataOrKeyOrPath =
      "_" + resolveScriptToCommand(global.kitScript)
  }

  let dbPath = ""

  if (typeof dataOrKeyOrPath === "string") {
    dbPath = dataOrKeyOrPath
    if (!dataOrKeyOrPath.endsWith(".json")) {
      dbPath = resolveKenv("db", `${dataOrKeyOrPath}.json`)
    }
  }

  let parentExists = await isDir(path.dirname(dbPath))
  if (!parentExists) {
    console.warn(
      `Couldn't find ${path.dirname(
        dbPath
      )}. Returning defaults...`
    )
    return {
      ...(data || {}),
      write: () => {},
    }
  }

  let _db = new Low(new JSONFile(dbPath), null)

  await _db.read()

  if (!_db.data || !fromCache) {
    let getData = async () => {
      if (typeof data === "function") {
        let result = await (data as any)()
        if (Array.isArray(result)) return { items: result }

        return result
      }

      if (Array.isArray(data)) return { items: data }

      return data
    }

    _db.data = await getData()

    try {
      await _db.write()
    } catch (error) {
      if (global.log) {
        global.log(error)
      }
    }
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
  fromCache = true,
  ignoreKenvPattern = /^ignore$/
): Promise<
  Low & {
    scripts: Script[]
  }
> => {
  // if (!fromCache) console.log(`🔄 Refresh scripts db`)
  return await db(
    scriptsDbPath,
    async () => ({
      scripts: await parseScripts(ignoreKenvPattern),
    }),
    fromCache
  )
}

export let setScriptTimestamp = _.debounce(
  async (filePath: string): Promise<Script[]> => {
    let timestampsDb = await getTimestamps()
    let stamp = timestampsDb.stamps.find(
      stamp => stamp.filePath === filePath
    )
    if (stamp) {
      stamp.timestamp = Date.now()
    } else {
      timestampsDb.stamps.push({
        filePath,
        timestamp: Date.now(),
      })
    }

    let scriptsDb = await getScriptsDb(false)
    let script = scriptsDb.scripts.find(
      s => s.filePath === filePath
    )

    if (script) {
      scriptsDb.scripts = scriptsDb.scripts.sort(
        scriptsSort(timestampsDb.stamps)
      )
      await scriptsDb.write()
      await timestampsDb.write()
    }

    return scriptsDb.scripts
  },
  250,
  {
    leading: true,
    trailing: true,
  }
)

// export let removeScriptFromDb = async (
//   filePath: string
// ): Promise<Script[]> => {
//   let scriptsDb = await getScriptsDb()
//   let script = scriptsDb.scripts.find(
//     s => s.filePath === filePath
//   )

//   if (script) {
//     scriptsDb.scripts = scriptsDb.scripts.filter(
//       s => s.filePath !== filePath
//     )
//     await scriptsDb.write()
//   }

//   return scriptsDb.scripts
// }

export let refreshScriptsDb = async () => {
  await getScriptsDb(false)
}

export let getPrefs = async () => {
  return await db(kitPath("db", "prefs.json"))
}

export let getTimestamps = async (
  fromCache = true
): Promise<
  Low & {
    stamps: { filePath: string; timestamp: number }[]
  }
> => {
  return await db(
    timestampsPath,
    {
      stamps: [],
    },
    fromCache
  )
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
  } else {
    let result = scripts.find(
      s =>
        path.normalize(s.filePath) ===
        path.normalize(script)
    )

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

export let getScripts = async (
  fromCache = true,
  ignoreKenvPattern = /^ignore$/
) => {
  return (await getScriptsDb(fromCache, ignoreKenvPattern))
    .scripts
}

export let updateScripts = async (
  changedScriptPath: string
) => {
  let scriptsDb = await getScriptsDb(false)
  let scripts = await parseScripts()
  let changedScript = scripts.find(
    s => s.filePath === changedScriptPath
  )
  if (!changedScript) return
  let index = scriptsDb.scripts.findIndex(
    s => s.filePath === changedScriptPath
  )
  scriptsDb.scripts[index] = changedScript
  scriptsDb.write()
}

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

export type AppDb = {
  version: string
  openAtLogin: boolean
  previewScripts: boolean
  autoUpdate: boolean
  tray: boolean
  authorized: boolean
  searchDebounce?: boolean
  termFont?: string
  convertKeymap?: boolean
  cachePrompt?: boolean
  mini?: boolean
  disableGpu?: boolean
  disableBlurEffect?: boolean
}

export type UserDb = Partial<
  RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]["data"]
>

export const appDefaults: AppDb = {
  version: "0.0.0",
  openAtLogin: true,
  previewScripts: true,
  autoUpdate: true,
  tray: true,
  authorized: false,
  searchDebounce: true,
  termFont: "monospace",
  convertKeymap: true,
  cachePrompt: true,
  mini: false,
  disableGpu: false,
  disableBlurEffect: false,
}

export let getAppDb = async (): Promise<
  Low<any> & AppDb
> => {
  return await db(appDbPath, appDefaults)
}

export let getUserDb = async (): Promise<
  Low<any> & UserDb
> => {
  return await db(userDbPath, {})
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
