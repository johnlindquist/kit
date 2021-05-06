export let exists = async (input: string) => {
  let check = (await cli("exists", input)).exists
  return check
}

export let info = async (input: string) =>
  await cli("info", input)

export let findScript = async (input: string) => {
  return (await cli("find-script", input)).found
}

export let scripts = async () =>
  (await cli("scripts")).scripts

export let buildMenu = async (fromCache = true) => {
  let menuCachePath = kenvPath("cache", "menu-cache.json")
  if (fromCache && (await isFile(menuCachePath))) {
    return getScripts()
  }
  return await (await cli("menu")).menu
}

export let enhancedMenu = async (fromCache = true) => {
  console.log(`ENHANCED MENU`)
  let { formatDistanceToNowStrict, format } = await npm(
    "date-fns"
  )

  let menuItems: MenuItem[] = await buildMenu(fromCache)

  let { tasks, schedule } = await global.getScriptsState()

  return menuItems.map(script => {
    if (script.background) {
      let task = tasks.find(
        task => task.filePath === script.filePath
      )

      script.description = `${script.description || ""}${
        task
          ? `🟢  Uptime: ${formatDistanceToNowStrict(
              new Date(task.process.start)
            )} PID: ${task.process.pid}`
          : "🛑 isn't running"
      }`
    }

    if (script.schedule) {
      let s = schedule.find(
        s => s.filePath === script.filePath
      )

      if (s) {
        let date = new Date(s.date)
        let next = `Next ${formatDistanceToNowStrict(date)}`
        let cal = `${format(date, "MMM eo, h:mm:ssa ")}`

        script.description = `${
          script.description || ``
        } ${next} - ${cal} - ${script.schedule}`
      }
    }

    if (script.watch) {
      script.description = `${
        script.description || ``
      } Watching: ${script.watch}`
    }

    return script
  })
}

interface Menu {
  (fromCache?: boolean): Promise<MenuItem[]>
}

export let menu: Menu = async (fromCache = true) => {
  return process?.send
    ? enhancedMenu(fromCache)
    : buildMenu(fromCache)
}

interface ScriptValue {
  (pluck: keyof Script, fromCache?: boolean): () => Promise<
    Choice<string>[]
  >
}

export let scriptValue: ScriptValue = (
  pluck,
  fromCache
) => async () => {
  let menuItems: MenuItem[] = await menu(fromCache)

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
