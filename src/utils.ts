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

export let exists = async (input: string) => {
  let check = (await cli("exists", input)).exists
  return check
}

export let findScript = async (input: string) => {
  return (await cli("find-script", input)).found
}

export let scripts = async () =>
  (await cli("scripts")).scripts

export let scriptsCachePath = () =>
  kitAppPath("db", "main.json")

export let buildMainPromptChoices = async (
  fromCache = true
) => {
  return (
    await db(
      scriptsCachePath(),
      async () => ({
        choices: await scriptsAsChoices(),
      }),
      fromCache
    )
  ).choices
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
    send("TOGGLE_BACKGROUND", { filePath: script.filePath })
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

export let info = async (infoFor: string) => {
  let file = infoFor || (await arg("Get info for:"))
  !file.endsWith(".js") && (file = `${file}.js`) //Append .js if you only give script name

  let filePath = file.startsWith("/scripts")
    ? kenvPath(file)
    : file.startsWith(path.sep)
    ? file
    : kenvPath(!file.includes("/") && "scripts", file)

  let fileContents = await readFile(filePath, "utf8")

  let fileLines = fileContents.split("\n")

  let command = file.replace(".js", "")
  let shortcut = getByMarker("Shortcut:")(fileLines)
  let menu = getByMarker("Menu:")(fileLines)

  return {
    command,
    shortcut,
    menu,
    name:
      (menu || command) + (shortcut ? `: ${shortcut}` : ``),

    description: getByMarker("Description:")(fileLines),
    alias: getByMarker("Alias:")(fileLines),
    author: getByMarker("Author:")(fileLines),
    twitter: getByMarker("Twitter:")(fileLines),
    shortcode: getByMarker("Shortcode:")(fileLines),
    exclude: getByMarker("Exclude:")(fileLines),
    schedule: getByMarker("Schedule:")(fileLines),
    watch: getByMarker("Watch:")(fileLines),
    system: getByMarker("System:")(fileLines),
    background: getByMarker("Background:")(fileLines),

    id: filePath,
    filePath,
  }
}

export let scriptsAsChoices = async () => {
  let scriptFiles = await scripts()

  return (await Promise.all(scriptFiles.map(info)))
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
  return await db(kitAppPath("db", "prefs.json"))
}
