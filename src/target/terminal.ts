import { enquirer } from "@johnlindquist/kit-internal/enquirer"
import { minimist } from "@johnlindquist/kit-internal/minimist"
import { PromptConfig } from "../types/core"
import { assignPropsTo } from "../core/utils.js"
import { Rectangle } from "../types/electron"
import { EditorOptions } from "../types/kitapp"

type Enquirer =
  typeof import("@johnlindquist/kit-internal/enquirer").enquirer
type Prompt = Enquirer["prompt"]
type EnquirerPromptConfig = Parameters<Prompt>[0]

let notSupported = async (method: string) => {
  console.warn(`${method} is not supported in the terminal`)
}

global.kitPrompt = async (config: any) => {
  if (config?.choices) {
    let choices = config.choices
    if (typeof choices === "function") {
      choices = await choices()
    }

    config = {
      ...config,
      type: "autocomplete",
      choices: choices?.map(c => {
        if (typeof c === "string") return c
        else
          return {
            name: c?.name || c?.value,
            value:
              typeof c?.value !== "undefined"
                ? c?.value
                : c?.name,
          }
      }),
    }
  }
  if (config?.secret) {
    config = { type: "password", ...config }
  }

  config = { type: "input", name: "value", ...config }

  if (typeof config.choices === "function") {
    let f = config.choices

    if (config.choices.length === 0) {
      let choices = config.choices()
      if (typeof choices?.then === "function")
        choices = await choices
      choices = choices.map(({ name, value }) => ({
        name,
        value,
      }))
      config = {
        ...config,
        choices,
      }
    } else {
      let { default: _ } = (await import("lodash")) as any

      let suggest = _.debounce(async function (input) {
        let results = await f(input)

        if (_.isUndefined(results) || _.isString(results))
          results = [input]

        this.choices = await this.toChoices(
          results?.choices || results
        )
        await this.render()

        return this.choices
      }, 250)
      config = {
        ...config,
        choices: config?.input ? [config?.input] : [],
        suggest,
      }
    }
  }

  let promptConfig: EnquirerPromptConfig = {
    ...config,
    message: config.placeholder,
  }
  let { prompt }: Enquirer = enquirer
  // TODO: Strip out enquirer autocomplete

  ;(prompt as any).on("cancel", () => process.exit())

  let result = (await prompt(promptConfig)) as any

  return result.value
}

global.arg = async (messageOrConfig = "Input", choices) => {
  let firstArg = global.args.length
    ? global.args.shift()
    : null
  if (firstArg) {
    let valid = true
    if (
      typeof messageOrConfig !== "string" &&
      (messageOrConfig as PromptConfig)?.validate
    ) {
      let { validate } = messageOrConfig as PromptConfig
      let validOrMessage = await validate(firstArg)
      if (typeof validOrMessage === "string") {
        console.log(validOrMessage)
      }
      if (
        typeof validOrMessage === "string" ||
        !validOrMessage
      ) {
        valid = false
      }
    }

    if (valid) {
      return firstArg
    }
  }

  let config: PromptConfig = { placeholder: "" }

  if (typeof messageOrConfig === "string") {
    config.placeholder = messageOrConfig
  } else {
    config = messageOrConfig
  }

  if (Array.isArray(choices) && choices?.length === 0) {
    console.log(`No choices available... 😅`)
    global.exit()
  }

  config.choices = choices
  let input = await global.kitPrompt(config)

  return input
}

global.textarea = global.arg

global.args = []
global.updateArgs = arrayOfArgs => {
  let argv = minimist(arrayOfArgs)

  global.args = [...argv._, ...global.args]
  global.argOpts = Object.entries(argv)
    .filter(([key]) => key != "_")
    .flatMap(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) return [`--${key}`]
        if (!value) return [`--no-${key}`]
      }
      return [`--${key}`, value as string]
    })

  assignPropsTo(argv, global.arg)
  global.flag = { ...argv, ...global.flag }
  delete global.flag._
}
global.updateArgs(process.argv.slice(2))

let terminalInstall = async packageName => {
  if (!global.flag?.trust) {
    let installMessage = global.chalk`\n{green ${global.kitScript}} needs to install the npm library: {yellow ${packageName}}`
    let response = await global.get<any>(
      `https://api.npmjs.org/downloads/point/last-week/` +
        packageName
    )
    let downloadsMessage = global.chalk`{yellow ${packageName}} has had {yellow ${response.data?.downloads}} downloads from npm in the past week`
    let packageLink = `https://npmjs.com/package/${packageName}`
    let readMore = global.chalk`
  Read more about {yellow ${packageName}} here: {yellow ${packageLink}}
  `
    global.echo(installMessage)
    global.echo(downloadsMessage)
    global.echo(readMore)
    let message = global.chalk`Do you trust {yellow ${packageName}}?`
    let config: PromptConfig = {
      placeholder: message,
      choices: [
        { name: "No", value: false },
        { name: "Yes", value: true },
      ],
    }
    let trust = await global.kitPrompt(config)
    if (!trust) {
      global.echo(`Ok. Exiting...`)
      global.exit()
    }
  }
  global.echo(
    global.chalk`Installing {yellow ${packageName}} and continuing...`
  )
  await global.cli("install", packageName)
}

let { createNpm } = await import("../api/npm.js")
global.npm = createNpm(terminalInstall)

global.getBackgroundTasks = async () => ({
  channel: "",
  tasks: [],
})

global.getSchedule = async () => ({
  channel: "",
  schedule: [],
})

global.getScriptsState = async () => ({
  channel: "",
  tasks: [],
  schedule: [],
})

global.div = async (html = "", containerClasses = "") => {
  if (global.flag?.log === false) return

  // let { default: cliHtml } = await import("cli-html")
  console.log(html)
}

global.textarea = async () => {
  console.warn(`"textarea" is not support in the terminal`)

  global.exit()
}

global.edit = async filePath => {
  if (global.flag?.edit === false) return
  if (global?.env?.KIT_TERMINAL_EDITOR) {
    if (global?.env?.KIT_TERMINAL_EDITOR === "kit") {
      try {
        await exec(
          `~/.kit/kar ~/.kit/cli/edit.js '${filePath}'`
        )
      } catch (error) {}
    } else {
      await spawn(
        global.env.KIT_TERMINAL_EDITOR,
        [filePath],
        {
          stdio: "inherit",
        }
      )
    }
  } else {
    if (global?.env?.KIT_EDITOR === "kit") {
      await spawn("vim", [filePath], {
        stdio: "inherit",
      })
    } else {
      await spawn(global.env.KIT_EDITOR, [filePath], {
        stdio: "inherit",
      })
    }
  }
}

global.editor = async (options: EditorOptions) => {
  if (global.flag?.edit === false) return
  global.edit(options.file)
}

global.drop = async () => {
  console.warn(`"drop" is not support in the terminal`)

  global.exit()
}

global.setChoices = async () => {}
global.clearTabs = async () => {}

global.setPanel = async (html, containerClasses = "") => {}
global.setPreview = async (
  html,
  containerClasses = ""
) => {}
global.setPanelContainer = async (
  html,
  containerClasses = ""
) => {}

global.setIgnoreBlur = async ignore => {}
global.setResize = async resize => {}

global.setBounds = (bounds: Partial<Rectangle>) => {}

global.setDescription = (description: string) => {
  // console.log({ description })
}
global.setName = (name: string) => {
  // console.log({ name })
}

global.getScriptsState = () => {
  notSupported("getScriptsState")
}

global.setBounds = (bounds: Partial<Rectangle>) => {
  notSupported("setBounds")
}

global.getClipboardHistory = async () => {
  notSupported("getClipboardHistory")
  return []
}

global.removeClipboardItem = (id: string) => {
  notSupported("removeClipboardItem")
}

global.clearClipboardHistory = async () => {
  notSupported("clearClipboardHistory")
  return []
}

global.submit = async (value: any) => {
  notSupported("submit")
}

global.setConfig = (value: any) => {
  notSupported("setConfig")
}

global.setLoading = (loading: boolean) => {}

global.copy = async text => {
  let c = await npm("clipboardy")
  c.write(text)
}

global.paste = async () => {
  let c = await npm("clipboardy")
  return c.read()
}

global.trash = async (...args) => {
  global.flag.trust = true
  let t = await npm("trash")
  t(...args)
}

global.rm = async (...args) => {
  global.flag.trust = true
  let t = await npm("trash")
  t(...args)
}

type pathConfig = { startPath?: string; hint?: string }
let __pathSelector = async (
  config: string | pathConfig = home()
) => {
  return await arg(
    (config as pathConfig)?.hint || "Select Path"
  )
}

let __path = global.path
global.path = new Proxy(__pathSelector, {
  get: (target, k: string) => {
    if (k === "then") return __pathSelector
    return __path[k]
  },
}) as any
