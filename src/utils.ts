import { Channel, ProcessType } from "./enums.js"

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

export let getScripts = async () => {
  let scriptsPath = kenvPath("scripts")

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
}

export let buildMainPromptChoices = async (
  fromCache = true
) => {
  return (
    await db(
      "scripts",
      async () => ({
        scripts: await writeScriptsDb(),
      }),
      fromCache
    )
  ).scripts
}
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

export let scriptPathFromCommand = (command: string) =>
  kenvPath("scripts", `${command}.js`)

let getByMarker = (marker: string) => (lines: string[]) =>
  lines
    ?.find(line =>
      line.match(
        new RegExp(`^\/\/\\s*${marker}\\s*`, "gim")
      )
    )
    ?.split(marker)[1]
    ?.trim()

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

  let fileLines = fileContents.split("\n")

  const command = filePath
    .split(path.sep)
    ?.pop()
    ?.replace(".js", "")
  let shortcut = getByMarker("Shortcut:")(fileLines)
  let menu = getByMarker("Menu:")(fileLines)
  let placeholder =
    getByMarker("Placeholder:")(fileLines) || menu
  let schedule = getByMarker("Schedule:")(fileLines)
  let watch = getByMarker("Watch:")(fileLines)
  let system = getByMarker("System:")(fileLines)
  let background = getByMarker("Background:")(fileLines)
  let input = getByMarker("Input:")(fileLines) || "text"
  let timeout = parseInt(
    getByMarker("Timeout:")(fileLines),
    10
  )

  let tabs =
    fileContents.match(
      new RegExp(`(?<=onTab[(]['"]).*(?=\s*['"])`, "gim")
    ) || []

  let requiresPrompt = Boolean(
    fileLines.find(line =>
      line.match(
        /await arg|await drop|await textarea|await hotkey|await main/g
      )
    )
  )

  let type = schedule
    ? ProcessType.Schedule
    : watch
    ? ProcessType.Watch
    : system
    ? ProcessType.System
    : background
    ? ProcessType.Background
    : ProcessType.Prompt

  return {
    command,
    type,
    shortcut,
    menu,
    name:
      (menu || command) + (shortcut ? `: ${shortcut}` : ``),
    placeholder,

    description: getByMarker("Description:")(fileLines),
    alias: getByMarker("Alias:")(fileLines),
    author: getByMarker("Author:")(fileLines),
    twitter: getByMarker("Twitter:")(fileLines),
    shortcode: getByMarker("Shortcode:")(fileLines),
    exclude: getByMarker("Exclude:")(fileLines),
    schedule,
    watch,
    system,
    background,
    file,
    id: filePath,
    filePath,
    requiresPrompt,
    timeout,
    tabs,
    input,
  }
}

export let writeScriptsDb = async () => {
  let scriptFiles = await getScripts()
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

export let getPrefs = async () => {
  return await db(kitPath("db", "prefs.json"))
}
