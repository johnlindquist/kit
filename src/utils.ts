import { Bin, Channel } from "./core/enum.js"

import { Script } from "./core/type.js"
import {
  getScripts,
  getScriptFromString,
} from "./core/db.js"
import {
  getKenvs,
  getLastSlashSeparated,
} from "./core/util.js"

export let selectScript = async (
  message: string | PromptConfig = "Select a script",
  fromCache = true,
  xf = x => x
): Promise<Script> => {
  let script = await arg<Script | string>(
    message,
    xf(await getScripts(fromCache))
  )

  if (typeof script === "string") {
    return await getScriptFromString(script)
  }

  return script
}

//validator
export let exists = async (input: string) => {
  return (await isBin(kenvPath("bin", input)))
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

export let createBinFromName = async (
  command: string,
  kenv: string
) => {
  let binTemplate = await readFile(
    kitPath("templates", "bin", "template"),
    "utf8"
  )

  let binTemplateCompiler = compile(binTemplate)
  let compiledBinTemplate = binTemplateCompiler({
    command,
    type: Bin.scripts,
    ...env,
    TARGET_PATH: kenv,
  })

  let binFilePath = path.resolve(kenv, "bin", command)

  mkdir("-p", path.dirname(binFilePath))
  await writeFile(binFilePath, compiledBinTemplate)
  chmod(755, binFilePath)
}

export let trashBinFromScript = async (script: Script) => {
  trash([
    kenvPath(
      script.kenv && `kenvs/${script.kenv}`,
      "bin",
      script.command
    ),
  ])
}

type Kenv = {
  name: string
  dirPath: string
}
export let selectKenv = async (): Promise<Kenv> => {
  let homeKenv = {
    name: "home",
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: "home",
      dirPath: kenvPath(),
    },
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs()
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map(p => {
        let name = getLastSlashSeparated(p, 1)
        return {
          name,
          description: p,
          value: {
            name,
            dirPath: p,
          },
        }
      }),
    ]

    selectedKenv = await arg<Kenv | string>(
      `Select target kenv`,
      kenvChoices
    )

    if (typeof selectedKenv === "string") {
      return kenvChoices.find(
        c =>
          c.value.name === selectedKenv ||
          path.resolve(c.value.dirPath) ===
            path.resolve(selectedKenv as string)
      ).value
    }
  }

  return selectedKenv as Kenv
}
