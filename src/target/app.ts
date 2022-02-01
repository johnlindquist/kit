import {
  ChannelHandler,
  Choice,
  PromptConfig,
  PromptData,
} from "../types/core"

import {
  GetAppData,
  KeyData,
  AppState,
  AppMessage,
  EditorOptions,
} from "../types/kitapp"

import {
  filter,
  Observable,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
  Subject,
} from "@johnlindquist/kit-internal/rxjs"
import { minimist } from "@johnlindquist/kit-internal/minimist"
import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Mode, Channel, UI } from "../core/enum.js"
import {
  assignPropsTo,
  mainScriptPath,
  cmd,
} from "../core/utils.js"
import {
  KeyEnum,
  keyCodeFromKey,
} from "../core/keyboard.js"
import { Rectangle } from "../types/electron"
import { Dirent } from "fs"
import { EventEmitter } from "events"

interface DisplayChoicesProps {
  choices: PromptConfig["choices"]
  className: string
  input: string
  scripts?: PromptConfig["scripts"]
  onInput?: PromptConfig["onInput"]
  state: AppState
  onEscape?: PromptConfig["onEscape"]
  onAbandon?: PromptConfig["onAbandon"]
  onBack?: PromptConfig["onBack"]
  onForward?: PromptConfig["onForward"]
  onUp?: PromptConfig["onUp"]
  onDown?: PromptConfig["onDown"]
  onLeft?: PromptConfig["onLeft"]
  onRight?: PromptConfig["onRight"]
  onTab?: PromptConfig["onTab"]
  onNoChoices?: PromptConfig["onNoChoices"]
  onChoiceFocus?: PromptConfig["onChoiceFocus"]
  onBlur?: PromptConfig["onChoiceFocus"]
}

let promptId = 0

let onExitHandler = () => {}
global.onExit = handler => {
  onExitHandler = handler
}

process.on("beforeExit", () => {
  onExitHandler()
})

let displayChoices = async ({
  choices,
  className,
  scripts,
}: DisplayChoicesProps) => {
  switch (typeof choices) {
    case "string":
      global.setPanel(choices, className)
      break

    case "object":
      if (choices === null) {
        global.setChoices(null)
      } else {
        let resultChoices = checkResultInfo(choices)
        global.setChoices(resultChoices, className, scripts)
      }

      break
  }
}

let checkResultInfo = result => {
  if (result?.preview) {
    global.setPanel(result.preview, result?.className || "")
  }
  if (result?.panel) {
    global.setPanel(result.panel, result?.className || "")
  }
  if (result?.hint) {
    global.setHint(result.hint)
  }
  if (result?.choices) {
    return result.choices
  }

  return result
}

interface InvokeChoicesProps extends DisplayChoicesProps {
  promptId: number
  tabIndex: number
}

let invocation = 0
let invokeChoices = async (props: InvokeChoicesProps) => {
  invocation++
  let localInvocation = invocation
  if (Array.isArray(props.choices)) {
    displayChoices(props)
    return props.choices
  }
  let resultOrPromise = (props.choices as Function)(
    props.state.input
  )

  if (resultOrPromise && resultOrPromise.then) {
    let result = await resultOrPromise
    if (localInvocation !== invocation) return
    if (
      props.promptId === promptId &&
      props.tabIndex === global.onTabIndex
    ) {
      displayChoices({ ...props, choices: result })
      return result
    }
  } else {
    displayChoices({ ...props, choices: resultOrPromise })
    return resultOrPromise
  }
}

let getInitialChoices = async (
  props: InvokeChoicesProps
) => {
  if (typeof props?.choices === "function") {
    return await invokeChoices({ ...props, input: "" })
  } else {
    displayChoices(props)
    return props.choices
  }
}

interface WaitForPromptValueProps
  extends Omit<DisplayChoicesProps, "input"> {
  validate?: PromptConfig["validate"]
}

let invalid = Symbol("invalid")

let createOnChoiceFocusDefault = (
  debounceChoiceFocus: number,
  onUserChoiceFocus?: ChannelHandler
) =>
  _.debounce(
    async (input: string, state: AppState = {}) => {
      let preview = ``

      let { index, focused } = state
      let { id } = focused

      let choice = (global.kitPrevChoices || []).find(
        (c: Choice) => c?.id === id
      )

      if (
        choice &&
        choice?.preview &&
        typeof choice?.preview === "function"
      ) {
        ;(choice as any).index = index
        ;(choice as any).input = input

        if (choice?.onFocus) {
          try {
            choice?.onFocus(choice)
          } catch (error) {
            throw new Error(error)
          }
        }

        try {
          preview = await choice?.preview(choice)
        } catch {
          preview = md(`## ⚠️ Failed to render preview`)
        }
      }

      setPreview(preview)

      if (typeof onUserChoiceFocus === "function")
        onUserChoiceFocus(input, state)
    },
    debounceChoiceFocus
  )

let onTabChanged = (input, state) => {
  let { tab } = state
  let tabIndex = global.onTabs.findIndex(({ name }) => {
    return name == tab
  })

  global.onTabIndex = tabIndex
  global.currentOnTab = global.onTabs?.[tabIndex]?.fn(input)
}

let waitForPromptValue = ({
  choices,
  validate,
  className,
  onNoChoices,
  onInput,
  onEscape,
  onAbandon,
  onBack,
  onForward,
  onUp,
  onDown,
  onTab,
  onChoiceFocus,
  onBlur,
  onLeft,
  onRight,
}: WaitForPromptValueProps) => {
  return new Promise((resolve, reject) => {
    promptId++
    getInitialChoices({
      promptId,
      tabIndex: global.onTabIndex,
      choices,
      className,
      input: "",
      onNoChoices,
      state: {},
    })

    let process$ = new Observable<AppMessage>(observer => {
      let m = (data: AppMessage) => {
        observer.next(data)
      }
      let e = (error: Error) => {
        observer.error(error)
      }
      process.on("message", m)
      process.on("error", e)
      global.__emitter__.on("message", m)
      return () => {
        process.off("message", m)
        process.off("error", e)
        global.__emitter__.off("message", m)
      }
    }).pipe(takeUntil(kitPrompt$), share())

    let tab$ = process$.pipe(
      filter(data => data.channel === Channel.TAB_CHANGED),
      share()
    )

    let message$ = process$.pipe(takeUntil(tab$), share())

    let valueSubmitted$ = message$.pipe(
      filter(
        data => data.channel === Channel.VALUE_SUBMITTED
      ),
      share()
    )

    tab$
      .pipe(takeUntil(valueSubmitted$))
      .subscribe(data => {
        onTabChanged(data.state.input, data.state)
      })

    message$
      .pipe(takeUntil(valueSubmitted$), share())
      .subscribe({
        next: async data => {
          switch (data.channel) {
            case Channel.INPUT:
              onInput(data.state.input, data.state)
              break

            case Channel.NO_CHOICES:
              onNoChoices(data.state.input, data.state)
              break

            case Channel.ESCAPE:
              onEscape(data.state.input, data.state)
              break

            case Channel.BACK:
              onBack(data.state.input, data.state)
              break

            case Channel.FORWARD:
              onForward(data.state.input, data.state)
              break

            case Channel.UP:
              onUp(data.state.input, data.state)
              break

            case Channel.DOWN:
              onDown(data.state.input, data.state)
              break

            case Channel.LEFT:
              onLeft(data.state.input, data.state)
              break

            case Channel.RIGHT:
              onRight(data.state.input, data.state)
              break

            case Channel.TAB:
              onTab(data.state.input, data.state)
              break

            case Channel.CHOICE_FOCUSED:
              onChoiceFocus(data.state.input, data.state)
              break

            case Channel.BLUR:
              onBlur(data.state.input, data.state)
              break

            case Channel.ABANDON:
              onAbandon(data.state.input, data.state)
              break
          }
        },
        complete: () => {
          global.log(
            `${process.pid}: ✂️  Remove all handlers`
          )
        },
      })

    let value$ = valueSubmitted$.pipe(
      tap(data => {
        if (data.state?.flag) {
          global.flag[data.state?.flag] = true
        }
      }),
      switchMap(async (data: AppMessage) => {
        let { value, focused } = data?.state
        let choice = (global.kitPrevChoices || []).find(
          (c: Choice) => c.id === focused?.id
        )
        if (choice?.onSubmit) {
          await choice?.onSubmit(choice)
        }

        // TODO: Refactor out an invalid$ stream
        if (validate) {
          let validateMessage = await validate(value)
          if (
            typeof validateMessage === "boolean" &&
            !validateMessage
          ) {
            send(
              Channel.VALUE_INVALID,
              chalk`${value} is {red not valid}`
            )
            return invalid
          }

          if (typeof validateMessage === "string") {
            send(Channel.VALUE_INVALID, validateMessage)

            return invalid
          } else {
            return value
          }
        } else {
          return value
        }
      }),
      filter(value => value !== invalid),
      take(1),
      share()
    )

    value$.subscribe({
      next: value => {
        global.log(`${process.pid}: ✅  Value submitted`)
        resolve(value)
      },
      complete: () => {
        global.log(
          `${process.pid}: ✅ Prompt #${promptId} complete`
        )
      },
      error: error => {
        reject(error)
      },
    })
  })
}

let onNoChoicesDefault = async (input: string) => {
  setPreview(``)
}

let onEscapeDefault: ChannelHandler = async (
  input: string,
  state: AppState
) => {
  let { history, script } = state
  let previousScript = history?.[history.length - 2]

  if (
    script.filePath !== mainScriptPath &&
    previousScript?.filePath === mainScriptPath &&
    !state?.inputChanged
  ) {
    await mainScript()
  } else {
    process.exit()
  }
}

let onAbandonDefault = () => {
  global.log(
    `${process.pid}: Abandon caused exit. Provive a "onAbandon" handler to override.`
  )
  process.exit()
}

let onBackDefault = async () => {}
let onForwardDefault = async () => {}
let onUpDefault = async () => {}
let onDownDefault = async () => {}
let onLeftDefault = async () => {}
let onRightDefault = async () => {}
let onTabDefault = async () => {}

global.setPrompt = (data: Partial<PromptData>) => {
  let { tabs } = data
  if (tabs) global.onTabs = tabs

  global.send(Channel.SET_PROMPT_DATA, {
    scriptPath: global.kitScript,
    flags: prepFlags(data?.flags || {}),
    hint: "",
    ignoreBlur: false,
    input: "",
    kitScript: global.kitScript,
    kitArgs: global.args,
    mode: Mode.FILTER,
    placeholder: "",
    panel: "",
    preview: "",
    secret: false,
    selected: "",
    strict: false,
    tabs: global.onTabs?.length
      ? global.onTabs.map(({ name }) => name)
      : [],
    tabIndex: 0,
    type: "text",
    ui: UI.arg,
    resize: false,
    ...(data as PromptData),
  })
}

let prepPrompt = async (config: PromptConfig) => {
  let {
    choices,
    placeholder,
    preview,
    panel,
    onInputSubmit = {},
    onShortcutSubmit = {},
    ...restConfig
  } = config

  let mode =
    typeof choices === "function" && choices?.length > 0
      ? Mode.GENERATE
      : Mode.FILTER

  global.setPrompt({
    strict: Boolean(choices),
    hasPreview: Boolean(preview),
    ...restConfig,
    onInputSubmit,
    onShortcutSubmit,
    tabIndex: global.onTabs?.findIndex(
      ({ name }) => global.arg?.tab
    ),
    mode,
    placeholder: stripAnsi(placeholder || ""),

    panel:
      panel && typeof panel === "function"
        ? await panel()
        : (panel as string),
    preview:
      preview && typeof preview === "function"
        ? await preview()
        : (preview as string),
  })
}

let kitPrompt$ = new Subject()

let createOnInputDefault = (
  choices,
  className,
  debounceInput
) => {
  let mode =
    typeof choices === "function" && choices?.length > 0
      ? Mode.GENERATE
      : Mode.FILTER

  if (mode !== Mode.GENERATE) return async () => {}
  return _.debounce(async (input, state) => {
    return invokeChoices({
      promptId,
      tabIndex: global.onTabIndex,
      choices,
      className,
      input,
      state,
    })
  }, debounceInput)
}

let onBlurDefault = () => {
  global.log(
    `${process.pid}: Blur caused exit. Provive a "onBlur" handler to override.`
  )
  process.exit()
}

global.kitPrompt = async (config: PromptConfig) => {
  kitPrompt$.next(true)
  //need to let onTabs() gather tab names. See Word API

  await new Promise(r => setTimeout(r, 0))
  let {
    choices = null,
    className = "",
    validate = null,
    onNoChoices = onNoChoicesDefault,
    onEscape = onEscapeDefault,
    onAbandon = onAbandonDefault,
    onBack = onBackDefault,
    onForward = onForwardDefault,
    onUp = onUpDefault,
    onDown = onDownDefault,
    onLeft = onLeftDefault,
    onRight = onRightDefault,
    onTab = onTabDefault,
    debounceChoiceFocus = 0,
    onChoiceFocus,
    debounceInput = 200,
    onInput = createOnInputDefault(
      choices,
      className,
      debounceInput
    ),
    onBlur = onBlurDefault,
  } = config

  await prepPrompt(config)

  let choiceFocus = createOnChoiceFocusDefault(
    debounceChoiceFocus,
    onChoiceFocus
  )

  return await waitForPromptValue({
    choices,
    validate,
    className,
    onInput,
    onNoChoices,
    onEscape,
    onAbandon,
    onBack,
    onForward,
    onUp,
    onDown,
    onLeft,
    onRight,
    onTab,
    onChoiceFocus: choiceFocus,
    onBlur,
    state: {},
  })
}

global.drop = async (
  placeholder = "Waiting for drop..."
) => {
  let config: { placeholder?: string; hint?: string } =
    typeof placeholder === "string"
      ? { placeholder }
      : placeholder

  return await global.kitPrompt({
    ui: UI.drop,
    ...config,
    ignoreBlur: true,
  })
}

global.form = async (html = "", formData = {}) => {
  let config: { html: string; hint?: string } =
    typeof html === "string" ? { html } : html

  send(Channel.SET_FORM_HTML, {
    html: config.html,
    formData,
  })
  return await global.kitPrompt({
    hint: config.hint,
    ui: UI.form,
  })
}

let maybeWrapHtml = (html, containerClasses) => {
  return html?.length === 0
    ? `<div/>`
    : `<div class="${containerClasses}">${html}</div>`
}

global.div = async (html = "", containerClasses = "") => {
  let config: { html?: string; hint?: string } =
    typeof html === "string" ? { html } : html

  if (config.html.trim() === "")
    html = md("⚠️ html string was empty")
  return await global.kitPrompt({
    hint: config?.hint,
    choices: maybeWrapHtml(html, containerClasses),
    ui: UI.div,
  })
}

global.editor = async (options?: EditorOptions) => {
  if (options?.language) {
    let fileTypes = {
      css: "css",
      js: "javascript",
      json: "json",
      md: "markdown",
      mjs: "javascript",
      ts: "typescript",
    }

    if (fileTypes[options?.language]) {
      options.language = fileTypes[options.language]
    }
  }

  let defaultOptions: EditorOptions = {
    value: "",
    language: "",
    scrollTo: "top",
    onInput: () => {},
    onEscape: onEscapeDefault,
    onAbandon: onAbandonDefault,
    onBlur: () => {},
    ignoreBlur: true,
  }

  let editorOptions =
    typeof options === "string"
      ? { ...defaultOptions, value: options }
      : { ...defaultOptions, ...options }

  send(Channel.SET_EDITOR_CONFIG, editorOptions)

  return await global.kitPrompt({
    ui: UI.editor,
    hint: editorOptions?.hint,
    ignoreBlur: true,
    onInput: editorOptions?.onInput,
    onEscape: editorOptions?.onEscape,
    onAbandon: editorOptions?.onAbandon,
    onBlur: editorOptions?.onBlur,
  })
}

global.hotkey = async (
  placeholder = "Press a key combo:"
) => {
  let config =
    typeof placeholder === "string"
      ? { placeholder }
      : placeholder
  return await global.kitPrompt({
    ...config,
    ui: UI.hotkey,
  })
}

global.arg = async (
  placeholderOrConfig = "Type a value:",
  choices = null
) => {
  let firstArg = global.args.length
    ? global.args.shift()
    : null

  let hint =
    (placeholderOrConfig as PromptConfig)?.hint || ""

  if (firstArg) {
    let validate = (placeholderOrConfig as PromptConfig)
      ?.validate

    if (typeof validate === "function") {
      let valid: boolean | string = await validate(firstArg)

      if (typeof valid === "boolean" && valid)
        return firstArg

      hint =
        typeof valid === "boolean" && !valid
          ? `${firstArg} is not valid`
          : (valid as string)
    } else {
      return firstArg
    }
  }

  if (typeof placeholderOrConfig === "string") {
    return await global.kitPrompt({
      ui: UI.arg,
      hint,
      placeholder: placeholderOrConfig,
      choices: choices,
    })
  }

  return await global.kitPrompt({
    choices: choices,
    ...placeholderOrConfig,
    hint,
  })
}

global.textarea = async (
  options = {
    value: "",
    placeholder: `${cmd} + s to submit\n${cmd} + w to close`,
  }
) => {
  let textAreaOptions =
    typeof options === "string"
      ? { value: options }
      : options
  send(Channel.SET_TEXTAREA_CONFIG, textAreaOptions)
  return await global.kitPrompt({
    ui: UI.textarea,
    ignoreBlur: true,
  })
}

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

let appInstall = async packageName => {
  if (!global.arg?.trust) {
    let placeholder = `${packageName} is required for this script`

    let packageLink = `https://npmjs.com/package/${packageName}`

    let preview = md(
      `[${packageName}](${packageLink}) has had ${
        (
          await get<{ downloads: number }>(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      } downloads from npm in the past week`
    )

    let trust = await global.arg(
      { placeholder, ignoreBlur: true },
      [
        {
          name: `Abort`,
          value: "false",
          preview,
        },
        {
          name: `Install ${packageName}`,
          value: "true",
          preview,
        },
      ]
    )

    if (trust === "false") {
      echo(`Ok. Exiting...`)
      exit()
    }
  }

  setHint(`Installing ${packageName}...`)
  setIgnoreBlur(true)

  await global.cli("install", packageName)
}

let { createNpm } = await import("../api/npm.js")
global.npm = createNpm(appInstall)

global.setPanel = async (h, containerClasses = "") => {
  let html = maybeWrapHtml(h, containerClasses)
  global.send(Channel.SET_PANEL, html)
}

global.setDiv = async (h, containerClasses = "") => {
  let html = maybeWrapHtml(h, containerClasses)
  global.send(Channel.SET_PANEL, html)
}

global.setPreview = async (h, containerClasses = "") => {
  let html = maybeWrapHtml(h, containerClasses)
  global.send(Channel.SET_PREVIEW, html)
  setLoading(false)
}

global.setMode = async mode => {
  global.send(Channel.SET_MODE, mode)
}

global.setHint = async hint => {
  global.send(Channel.SET_HINT, hint)
}

global.setInput = async input => {
  global.send(Channel.SET_INPUT, input)
}

global.setFilterInput = async inputFilter => {
  global.send(Channel.SET_FILTER_INPUT, inputFilter)
}

global.setIgnoreBlur = async ignore => {
  global.send(Channel.SET_IGNORE_BLUR, ignore)
}

global.getDataFromApp = async (
  channel: GetAppData,
  data: any
) => {
  if (process?.send) {
    return await new Promise((res, rej) => {
      let messageHandler = data => {
        if (data.channel === channel) {
          res(data)
          process.off("message", messageHandler)
        }
      }
      process.on("message", messageHandler)

      send(channel, data)
    })
  } else {
    return {}
  }
}

global.getBackgroundTasks = () =>
  global.getDataFromApp(Channel.GET_BACKGROUND)

global.getSchedule = () =>
  global.getDataFromApp(Channel.GET_SCHEDULE)
global.getBounds = async () => {
  let data = await global.getDataFromApp(Channel.GET_BOUNDS)
  return data?.bounds
}

global.getCurrentScreen = async () => {
  let data = await global.getDataFromApp(
    Channel.GET_SCREEN_INFO
  )
  return data?.screen
}

global.getScriptsState = () =>
  global.getDataFromApp(Channel.GET_SCRIPTS_STATE)

global.setBounds = (bounds: Partial<Rectangle>) => {
  global.send(Channel.SET_BOUNDS, bounds)
}

global.getClipboardHistory = async () =>
  (
    await global.getDataFromApp(
      Channel.GET_CLIPBOARD_HISTORY
    )
  )?.history

global.removeClipboardItem = (id: string) => {
  global.send(Channel.REMOVE_CLIPBOARD_HISTORY_ITEM, id)
}

global.__emitter__ = new EventEmitter()

global.submit = (value: any) => {
  let message: AppMessage = {
    channel: Channel.VALUE_SUBMITTED,
    state: {
      value,
    },
    pid: process.pid,
  }
  global.__emitter__.emit("message", message)
  global.send(Channel.CLEAR_PREVIEW)
}

global.wait = async (time: number) => {
  return new Promise(res =>
    setTimeout(() => {
      res()
    }, time)
  )
}

global.setDescription = (description: string) => {
  global.send(Channel.SET_DESCRIPTION, description)
}

global.setName = (name: string) => {
  global.send(Channel.SET_NAME, name)
}

global.setTextareaValue = (value: string) => {
  global.send(Channel.SET_TEXTAREA_VALUE, value)
}

global.appKeystroke = (data: KeyData) => {
  global.send(Channel.SEND_KEYSTROKE, {
    keyCode: keyCodeFromKey(data?.key),
    ...data,
  })
}

global.setLoading = (loading: boolean) => {
  global.send(Channel.SET_LOADING, loading)
}

let loadingList = [
  "$",
  "degit",
  "download",
  "exec",
  "fetch",
  "get",
  "patch",
  "post",
  "put",
  "spawn",
]
for (let method of loadingList) {
  let captureMethod = global[method]
  global[method] = (...args) => {
    global.setLoading(true)
    return captureMethod(...args)
  }
}

global.Key = KeyEnum

global.mainScript = async () => {
  if (process.env.KIT_CONTEXT === "app") {
    await run(mainScriptPath)
  }
}

let getFileInfo = async (filePath: string) => {
  return applescript(`
  set aFile to (POSIX file "${filePath}") as alias
  info for aFile    
  `)
}

let __pathSelector = async (
  currentDir: string = home(),
  { showHidden } = { showHidden: false }
) => {
  if (!currentDir.endsWith(path.sep)) currentDir += path.sep
  let slashCount = -1

  let lsCurrentDir = async input => {
    if (!input) {
      await mainScript()
    }
    let dirFilter = dirent => {
      if (dirent.name.startsWith(".")) {
        return input.startsWith(".") || showHidden
      }

      return true
    }

    if (input.startsWith("~")) currentDir = home()

    if (input.endsWith(path.sep)) {
      currentDir = input
    } else {
      currentDir = path.dirname(input)
    }
    let isCurrentDir = await isDir(currentDir)
    if (isCurrentDir) {
      try {
        let dirFiles = await readdir(currentDir, {
          withFileTypes: true,
        })
        setFilterInput(`[^\/]+$`)
        let dirents = dirFiles.filter(dirFilter)
        let folders = dirents.filter(dirent =>
          dirent.isDirectory()
        )
        let files = dirents.filter(
          dirent => !dirent.isDirectory()
        )

        let mapDirents = (dirents: Dirent[]): Choice[] => {
          return dirents.map(dirent => {
            let fullPath = path.resolve(
              currentDir,
              dirent.name
            )
            let type = dirent.isDirectory()
              ? "folder"
              : "file"
            return {
              img: kitPath("icons", type + ".svg"),
              name: dirent.name,
              value: fullPath,
              description: type,
              // preview: async () => {
              //   try {
              //     let fileInfo = await getFileInfo(fullPath)
              //     let formattedInfo = fileInfo
              //       .split(", ")
              //       .map(line => {
              //         return `* ${line}`
              //       })
              //       .join("\n")

              //     return md(formattedInfo)
              //   } catch (error) {
              //     return md(error)
              //   }
              // },
            }
          })
        }

        let choices = mapDirents(folders.concat(files))

        setChoices(choices)
      } catch {
        setPanel(md(`## Failed to read ${currentDir}`))
      }
    } else {
      setPanel(md(`## ${currentDir} is not a path`))
    }
  }

  let upDir = dir => {
    setInput(
      currentDir.replace(
        new RegExp(`[^${path.sep}]+.$`, "gi"),
        ""
      )
    )
  }

  let downDir = dir => {
    setInput(path.resolve(currentDir, dir) + path.sep)
  }

  let onInput = async (input, state) => {
    if (input.startsWith("~")) {
      setInput(home() + path.sep)
      return
    }
    let currentSlashCount = input.split(path.sep).length
    if (currentSlashCount != slashCount) {
      slashCount = currentSlashCount
      await lsCurrentDir(input)
    }
  }

  let onTab = async (input, state) => {
    let dir = state.focused.value

    if (state.modifiers.includes("shift")) {
      upDir(dir)
    } else {
      downDir(dir)
    }
  }

  let onRight = async (input, state) => {
    downDir(state.focused.value)
  }

  let onLeft = async (input, state) => {
    upDir(state.focused.value)
  }

  let onNoChoices = async input => {
    let isCurrentDir = await isDir(path.resolve(input))
    if (isCurrentDir) return
    let hasExtension = path.extname(input) !== ""
    if (hasExtension) {
      setPanel(md(`## Create <code>${input}</code> file`))
    } else {
      setPanel(
        md(`## Create <code>${input}</code> directory`)
      )
    }
  }

  let onEscape = async () => {
    setInput(``)
    await mainScript()
  }

  let selectedPath = await arg(
    {
      input: currentDir,
      onInput,
      onTab,
      onRight,
      onLeft,
      onNoChoices,
      onEscape,
    },
    []
  )

  let hasExtension = path.extname(selectedPath) == ""
  if (hasExtension) {
    let isSelectedPathDir = await isDir(selectedPath)
    if (!isSelectedPathDir) {
      await ensureDir(selectedPath)
    }
  } else {
    let isSelectedPathFile = await isFile(selectedPath)
    if (!isSelectedPathFile) {
      await ensureFile(selectedPath)
    }
  }

  return selectedPath
}

let __path = global.path
global.path = new Proxy(__pathSelector, {
  get: (target, k: string) => {
    if (k === "then") return __pathSelector
    return __path[k]
  },
}) as any

global.getEditorHistory = async () => {
  return (
    await global.getDataFromApp(Channel.GET_EDITOR_HISTORY)
  )?.state?.editorHistory
}

delete process.env?.["ELECTRON_RUN_AS_NODE"]
delete global?.env?.["ELECTRON_RUN_AS_NODE"]
