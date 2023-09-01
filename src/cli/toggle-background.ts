import { Channel } from "../core/enum.js"

let { tasks } = await global.getBackgroundTasks()

let scriptPath = await arg()

let command = path.basename(scriptPath)

let task = tasks.find(task => task.filePath === scriptPath)

let toggleOrLog: "toggle" | "log" | "edit" =
  await global.arg(
    `${command} is ${task ? `running` : `stopped`}`,
    [
      {
        name: `${task ? `Stop` : `Start`} ${command}`,
        value: `toggle`,
        id: uuid(),
      },
      {
        name: `Edit ${command}`,
        value: `edit`,
        id: uuid(),
      },
      {
        name: `View ${command}.log`,
        value: `log`,
        id: uuid(),
      },
    ]
  )

if (toggleOrLog === "toggle") {
  global.send(Channel.TOGGLE_BACKGROUND, scriptPath)
}

if (toggleOrLog === "edit") {
  await global.edit(scriptPath, kenvPath())
}

if (toggleOrLog === "log") {
  await global.edit(
    kenvPath("logs", `${command}.log`),
    kenvPath()
  )
}

export {}
