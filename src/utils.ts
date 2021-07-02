import { Bin, Channel, ProcessType, UI } from "./enums.js"

export let assignPropsTo = (
  source: { [s: string]: unknown } | ArrayLike<unknown>,
  target: { [x: string]: unknown }
) => {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

export let resolveToScriptPath = (script: string) => {
  if (!script.endsWith(".js")) script += ".js"

  if (script.startsWith(path.sep)) return script

  if (script.startsWith("."))
    script = path.resolve(process.cwd(), script)

  if (!script.includes(path.sep))
    return global.kenvPath("scripts", script)

  if (
    !script.includes(kenvPath()) &&
    !script.includes(kitPath())
  ) {
    global.cp(script, kitPath("tmp"))

    let tmpScript = kitPath(
      "tmp",
      script.replace(/.*\//gi, "")
    )
    return tmpScript
  }

  return script
}

export let getScriptFromString = async (
  script: string
): Promise<Script> => {
  let { scripts } = await getScriptsDb()

  if (!script.includes(path.sep)) {
    let result = scripts.find(
      s =>
        s.name === script ||
        s.command === script.replace(/\.js$/g, "")
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

export let selectScript = async (
  message = "Select a script",
  includePreview = false
): Promise<Script> => {
  let script = await arg<Script | string>(
    message,
    await buildMainPromptChoices()
  )

  if (typeof script === "string") {
    return await getScriptFromString(script)
  }

  return script
}

export let resolveScriptToCommand = (script: string) => {
  return script.replace(/.*\//, "").replace(".js", "")
}

export let exists = async (input: string) =>
  (await isBin(kenvPath("bin", input)))
    ? chalk`{red.bold ${input}} already exists. Try again:`
    : (await isDir(kenvPath("bin", input)))
    ? chalk`{red.bold ${input}} exists as group. Enter different name:`
    : exec(`command -v ${input}`, {
        silent: true,
      }).stdout
    ? chalk`{red.bold ${input}} is a system command. Enter different name:`
    : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
    ? chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
    : true

export let findScript = async (input: string) => {
  return (await cli("find-script", input)).found
}

export let getScripts = async (kenv = kenvPath()) => {
  let scriptsPath = path.join(kenv, "scripts")
  if (!(await isDir(scriptsPath))) {
    console.warn(`${scriptsPath} isn't a valid kenv dir`)
    return []
  }
  if (arg.dir) scriptsPath = `${scriptsPath}/${arg.dir}`

  let result = await readdir(scriptsPath, {
    withFileTypes: true,
  })

  return result
    .filter(file => file.isFile())
    .map(file => {
      let name = file.name
      if (arg.dir) name = `${arg.dir}/${name}`
      return name
    })
    .filter(name => name.endsWith(".js"))
    .map(file => path.join(scriptsPath, file))
}

export let buildMainPromptChoices = async (
  fromCache = true
) => (await getScriptsDb(fromCache)).scripts
interface ScriptValue {
  (pluck: keyof Script, fromCache?: boolean): () => Promise<
    Choice<string>[]
  >
}

export let scriptValue: ScriptValue =
  (pluck, fromCache) => async () => {
    let menuItems: Script[] = await buildMainPromptChoices(
      fromCache
    )

    return menuItems.map((script: Script) => ({
      ...script,
      value: script[pluck],
    }))
  }

export let toggleBackground = async (script: Script) => {
  let { tasks } = await global.getBackgroundTasks()

  let task = tasks.find(
    task => task.filePath === script.filePath
  )

  let toggleOrLog = await arg<"toggle" | "log" | "edit">(
    `${script.command} is ${task ? `running` : `stopped`}`,
    [
      {
        name: `${task ? `Stop` : `Start`} ${
          script.command
        }`,
        value: `toggle`,
      },
      { name: `Edit ${script.command}`, value: `edit` },
      { name: `View ${script.command}.log`, value: `log` },
    ]
  )

  if (toggleOrLog === "toggle") {
    send(Channel.TOGGLE_BACKGROUND, {
      filePath: script.filePath,
    })
  }

  if (toggleOrLog === "edit") {
    await edit(script.filePath, kenvPath())
  }

  if (toggleOrLog === "log") {
    await edit(
      kenvPath("logs", `${script.command}.log`),
      kenvPath()
    )
  }
}

export const shortcutNormalizer = (shortcut: string) =>
  shortcut
    ? shortcut
        .replace(/(option|opt)/i, "Alt")
        .replace(/(command|cmd)/i, "CommandOrControl")
        .replace(/(ctl|cntrl|ctrl)/, "Control")
        .split(/\s/)
        .filter(Boolean)
        .map(part =>
          (part[0].toUpperCase() + part.slice(1)).trim()
        )
        .join("+")
    : ""

export const friendlyShortcut = (shortcut: string) =>
  shortcut
    .replace(`CommandOrControl`, `cmd`)
    .replace(`Alt`, `opt`)
    .replace(`Control`, `ctrl`)
    .replace(`Shift`, `shift`)

export let info = async (
  infoFor: string
): Promise<Script> => {
  let file = infoFor || (await arg("Get info for:"))
  !file.endsWith(".js") && (file = `${file}.js`) //Append .js if you only give script name

  let filePath = file.startsWith("/scripts")
    ? kenvPath(file)
    : file.startsWith(path.sep)
    ? file
    : kenvPath(!file.includes("/") && "scripts", file)

  let fileContents = await readFile(filePath, "utf8")

  let getByMarker = (marker: string) =>
    fileContents
      .match(
        new RegExp(`(?<=^//\\s*${marker}\\s*).*`, "gim")
      )?.[0]
      .trim()

  let command = filePath
    .split(path.sep)
    ?.pop()
    ?.replace(".js", "")
  let shortcut = shortcutNormalizer(
    getByMarker("Shortcut:")
  )
  let menu = getByMarker("Menu:")
  let schedule = getByMarker("Schedule:")
  let watch = getByMarker("Watch:")
  let system = getByMarker("System:")
  let image = getByMarker("Image:")
  let background = getByMarker("Background:")
  let timeout = parseInt(getByMarker("Timeout:"), 10)

  let tabs =
    fileContents.match(
      new RegExp(`(?<=onTab[(]['"]).*(?=\s*['"])`, "gim")
    ) || []

  let ui = (getByMarker("UI:") ||
    fileContents
      .match(/(?<=await )arg|textarea|hotkey|drop/g)?.[0]
      .trim() ||
    UI.none) as UI

  let requiresPrompt = ui !== UI.none

  let type = schedule
    ? ProcessType.Schedule
    : watch
    ? ProcessType.Watch
    : system
    ? ProcessType.System
    : background
    ? ProcessType.Background
    : ProcessType.Prompt

  let kenv =
    filePath.match(
      new RegExp(`(?<=${kenvPath("kenvs")}\/)[^\/]+`)
    )?.[0] || ""

  let iconPath = kenv
    ? kenvPath("kenvs", kenv, "icon.png")
    : ""

  let icon =
    kenv && (await isFile(iconPath)) ? iconPath : ""

  return {
    command,
    type,
    shortcut,
    menu,
    name:
      (menu || command) +
      (shortcut ? `: ${friendlyShortcut(shortcut)}` : ``),

    description: getByMarker("Description:"),
    alias: getByMarker("Alias:"),
    author: getByMarker("Author:"),
    twitter: getByMarker("Twitter:"),
    shortcode: getByMarker("Shortcode:"),
    exclude: getByMarker("Exclude:"),
    schedule,
    watch,
    system,
    background,
    id: filePath,
    filePath,
    requiresPrompt,
    timeout,
    tabs,
    kenv,
    image,
    icon,
  }
}

export let getLastSlashSeparated = (
  string: string,
  count: number
) => {
  return (
    string
      .replace(/\/$/, "")
      .split("/")
      .slice(-count)
      .join("/") || ""
  )
}

export let getKenvs = async (): Promise<string[]> => {
  let kenvs = []
  if (!(await isDir(kenvPath("kenvs")))) return kenvs

  let kenvsDir = (...parts: string[]) =>
    kenvPath("kenvs", ...parts)

  for await (let kenvDir of await readdir(kenvsDir())) {
    kenvs.push(kenvsDir(kenvDir))
  }

  return kenvs
}

export let writeScriptsDb = async () => {
  let scriptFiles = await getScripts()
  let kenvDirs = await getKenvs()
  for await (let kenvDir of kenvDirs) {
    let scripts = await getScripts(kenvDir)
    scriptFiles = [...scriptFiles, ...scripts]
  }

  let scriptInfo = await Promise.all(scriptFiles.map(info))
  return scriptInfo
    .filter(
      (script: Script) =>
        !(script?.exclude && script?.exclude === "true")
    )
    .sort((a: Script, b: Script) => {
      let aName = a.name.toLowerCase()
      let bName = b.name.toLowerCase()

      return aName > bName ? 1 : aName < bName ? -1 : 0
    })
}

export let getScriptsDb = async (
  fromCache = true
): Promise<{
  scripts: Script[]
}> => {
  return await db(
    kitPath("db", "scripts.json"),
    async () => ({
      scripts: await writeScriptsDb(),
    }),
    fromCache
  )
}

export let getPrefs = async () => {
  return await db(kitPath("db", "prefs.json"))
}

export let stripMetadata = (fileContents: string) => {
  let markers = [
    "Menu",
    "Description",
    "Schedule",
    "Watch",
    "System",
    "Background",
    "Author",
    "Twitter",
    "Shortcode",
    "Exclude",
    "Alias",
  ]
  return fileContents.replace(
    new RegExp(`(^//\\s*(${markers.join("|")}):).*`, "gim"),
    "$1"
  )
}

export let createBinFromScript = async (
  type: Bin,
  { kenv, command }: Script
) => {
  let binTemplate = await readFile(
    kitPath("templates", "bin", "template"),
    "utf8"
  )

  let targetPath = (...parts) =>
    kenvPath(kenv && `kenvs/${kenv}`, ...parts)

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type,
    ...env,
    TARGET_PATH: targetPath(),
  })

  let binFilePath = targetPath("bin", command)

  mkdir("-p", path.dirname(binFilePath))
  await writeFile(binFilePath, compiledBinTemplate)
  chmod(755, binFilePath)
}
