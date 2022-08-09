import fs from "fs"
import filesize from "filesize"

import {
  AppState,
  ChannelHandler,
  Choice,
  PromptConfig,
  PromptData,
} from "../types/core"

import {
  GetAppData,
  KeyData,
  AppMessage,
  EditorOptions,
  Config,
  KitStatus,
  Field,
} from "../types/kitapp"

import {
  formatDistanceToNow,
  compareAsc,
} from "@johnlindquist/kit-internal/date-fns"

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

import {
  Key,
  Mode,
  Channel,
  UI,
  Value,
} from "../core/enum.js"
import {
  assignPropsTo,
  mainScriptPath,
  cmd,
} from "../core/utils.js"
import { keyCodeFromKey } from "../core/keyboard.js"
import { Rectangle } from "../types/electron"
import { Dirent } from "fs"
import { EventEmitter } from "events"

interface DisplayChoicesProps {
  choices: PromptConfig["choices"]
  className: string
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
  onPaste?: PromptConfig["onPaste"]
  onDrop?: PromptConfig["onDrop"]
  shortcuts?: PromptConfig["shortcuts"]
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
    return await invokeChoices({ ...props })
  } else {
    displayChoices(props)
    return props.choices
  }
}

interface WaitForPromptValueProps
  extends DisplayChoicesProps {
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
          preview = md(`### ⚠️ Failed to render preview`)
        }
      }

      if (typeof choice?.preview === "string") {
        preview = choice?.preview
      }

      if (preview) {
        setPreview(preview)
      }

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
  onPaste,
  onDrop,
  state,
  shortcuts,
}: WaitForPromptValueProps) => {
  return new Promise((resolve, reject) => {
    promptId++
    getInitialChoices({
      promptId,
      tabIndex: global.onTabIndex,
      choices,
      className,
      onNoChoices,
      state,
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

    tab$.pipe(takeUntil(value$)).subscribe(data => {
      onTabChanged(data.state.input, data.state)
    })

    message$.pipe(takeUntil(value$), share()).subscribe({
      next: async data => {
        if (data?.state?.input === Value.Undefined) {
          data.state.input = ""
        }
        // global.log({ channel: data.channel })
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

          case Channel.SHORTCUT:
            if (data?.state?.flag) {
              global.flag[data.state.flag] = true
            }
            const shortcut = shortcuts.find(({ key }) => {
              return key === data?.state?.shortcut
            })

            if (shortcut?.onPress) {
              shortcut.onPress?.(
                data.state.input,
                data.state
              )
            } else {
              submit(
                data.state?.focused?.value ||
                  data?.state?.input
              )
            }

            break

          case Channel.ON_PASTE:
            onPaste(data.state.input, data.state)
            break

          case Channel.ON_DROP:
            onDrop(data.state.input, data.state)
            break
        }
      },
      complete: () => {
        global.log(
          `${process.pid}: ✂️  Remove all handlers`
        )
      },
    })

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
    (previousScript?.filePath === mainScriptPath ||
      script.filePath.includes(".kit")) &&
    !state?.inputChanged
  ) {
    await mainScript()
  } else {
    process.exit()
  }
}

let onAbandonDefault = () => {
  global.log(
    `${process.pid}: Abandon caused exit. Provide a "onAbandon" handler to override.`
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
let onPasteDefault = async (input, state) => {
  if (state.paste) setSelectedText(state.paste, false)
}
let onDropDefault = async (input, state) => {
  if (state.drop) setSelectedText(state.drop, false)
}

global.setPrompt = (data: Partial<PromptData>) => {
  let { tabs } = data
  if (tabs) global.onTabs = tabs

  global.send(Channel.SET_PROMPT_DATA, {
    scriptPath: global.kitScript,
    flags: prepFlags(data?.flags),
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
    resize: true,
    env: global.env,
    ...(data as PromptData),
  })
}

let prepPrompt = async (config: PromptConfig) => {
  let {
    choices,
    placeholder,
    footer,
    preview,
    panel,
    onInputSubmit = {},
    ...restConfig
  } = config

  let mode =
    typeof choices === "function" && choices?.length > 0
      ? Mode.GENERATE
      : Mode.FILTER

  global.setPrompt({
    id: uuid(),
    footer: footer || "",
    strict: Boolean(choices),
    hasPreview: Boolean(preview),
    ...restConfig,
    onInputSubmit,
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
    env: config?.env || global.env,
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
  // "input" is on the state, so this is only provided as a convenience for the user
  return _.debounce(async (input, state) => {
    return invokeChoices({
      promptId,
      tabIndex: global.onTabIndex,
      choices,
      className,
      state,
    })
  }, debounceInput)
}

let onBlurDefault = () => {
  global.log(
    `${process.pid}: Blur caused exit. Provide a "onBlur" handler to override.`
  )
  process.exit()
}

global.kitPrompt = async (config: PromptConfig) => {
  kitPrompt$.next(true)
  //need to let onTabs() gather tab names. See Word API
  let escapeDefault = config?.shortcuts?.find(
    s => s.key === "escape"
  )
    ? () => {}
    : onEscapeDefault

  await new Promise(r => setTimeout(r, 0))
  let {
    choices = null,
    className = "",
    validate = null,
    onNoChoices = onNoChoicesDefault,
    onEscape = escapeDefault,
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
    input = "",
    onPaste = onPasteDefault,
    onDrop = onDropDefault,
    shortcuts = [],
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
    onPaste,
    onDrop,
    shortcuts,
    state: { input },
  })
}

global.drop = async (
  placeholder = "Waiting for drop..."
) => {
  let config: {
    placeholder?: string
    hint?: string
    footer?: string
  } =
    typeof placeholder === "string"
      ? { placeholder }
      : placeholder

  return await global.kitPrompt({
    ui: UI.drop,
    ...config,
    ignoreBlur: true,
  })
}

global.fields = async (...formFields) => {
  let config: PromptConfig = {}
  let f = []
  if (Array.isArray(formFields) && !formFields[0]?.fields) {
    f = formFields
  } else {
    config = formFields[0]
    f = config?.fields
  }

  let inputs = f
    .map((field, i) => {
      let defaultElement: any = {
        element: "input",
        label: "Label",
        required: true,
      }
      if (typeof field === "string") {
        defaultElement.label = field
        defaultElement.placeholder = field
      } else {
        Object.entries(field).forEach(([key, value]) => {
          defaultElement[key] = value
        })
      }
      let { element, label, id, name, ...attrs } =
        defaultElement
      let attributes = Object.entries(attrs)
        .map(([key, value]) => {
          return ` ${key}="${value}" `
        })
        .join("")
      // log(attributes)
      return `
      <div class="w-full pt-4 flex flex-col-reverse">
           
              <${element}
                  id="${id || i}"
                  name="${name || i}"
                  ${
                    i === 0 ? `autofocus` : ``
                  }                  
                  ${attributes}   
                  class="peer text-xl h-10 px-4 py-0 outline-none border-b placeholder-black dark:placeholder-white dark:placeholder-opacity-25 placeholder-opacity-25 border-black dark:border-white border-opacity-15 dark:border-opacity-15 dark:focus:border-primary-light focus:border-primary-dark w-full"/>

                  <label for=${id || i} htmlFor=${
        id || i
      } class="text-sm px-4 block font-normal dark:font-normal text-black dark:text-white peer-focus:text-primary-dark peer-focus:dark:text-primary-light">
                          ${label}
                        </label>
          </div>
      
      `
    })
    .join("")
  config.html = `<div class="flex flex-col items-center min-h-full">
<div class="flex-1 w-full">
${inputs}
</div>
<div class="flex flex-row w-full px-4 invisible">
<div class="flex-1"></div>
<input type="reset" name="reset" value="Reset" accesskey="r"> class="focus:underline underline-offset-4 outline-none p-3 dark:text-white text-opacity-50 dark:text-opacity-50 font-medium text-sm focus:text-primary-dark dark:focus:text-primary-light  hover:text-primary-dark dark:hover:text-primary-light hover:underline dark:hover:underline"/>
<input type="submit" name="submit" value="Submit" class="focus:underline underline-offset-4 outline-none p-3 text-primary-dark dark:text-primary-light text-opacity-75 dark:text-opacity-75 font-medium text-sm focus:text-primary-dark dark:focus:text-primary-light hover:text-primary-dark dark:hover:text-primary-light hover:underline dark:hover:underline"/>
</div>
</div>`
  config.shortcuts = [
    {
      name: "Reset",
      key: "cmd+alt+r",
      bar: "right",
    },
  ]
  let formResponse = await global.form(config)
  return Object.values(formResponse)
}

global.form = async (html = "", formData = {}) => {
  let config: PromptConfig = {}
  if ((html as PromptConfig)?.html) {
    config = html as PromptConfig
    config.formData = formData
  } else {
    config = {
      html: html as string,
      formData,
    }
  }

  config.ui = UI.form

  return await global.kitPrompt(config)
}

// global.form = async (
//   ...fields: PromptConfig[] | string[]
// ) => {
//   let configs: PromptConfig[] = []

//   for await (let f of fields) {
//     if (typeof f === "string") {
//       configs.push({
//         placeholder: f,
//       })
//     } else {
//       configs.push(f)
//     }
//   }
//   send(Channel.SET_FORM, configs)
// }

let maybeWrapHtml = (html, containerClasses) => {
  return html?.length === 0
    ? `<div/>`
    : `<div class="${containerClasses}">${html}</div>`
}

global.div = async (
  htmlOrConfig = "",
  containerClasses = ""
) => {
  let config: {
    html?: string
  } =
    typeof htmlOrConfig === "string"
      ? { html: htmlOrConfig }
      : htmlOrConfig

  if (config.html.trim() === "")
    htmlOrConfig = md("⚠️ html string was empty")
  return await global.kitPrompt({
    ...config,
    choices: maybeWrapHtml(config?.html, containerClasses),
    ui: UI.div,
  })
}

global.editor = async (options?: EditorOptions) => {
  if (options?.language) {
    let fileTypes = {
      css: "css",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      md: "markdown",
      mjs: "javascript",
      ts: "typescript",
      tsx: "typescript",
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
    onPaste: onPasteDefault,
    onDrop: onDropDefault,
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
    input: editorOptions.value,
    flags: {},
    shortcuts: [
      {
        name: "Close",
        key: `${cmd}+w`,
        bar: "right",
        onPress: () => {
          exit()
        },
      },
      {
        name: "Submit",
        key: `${cmd}+s`,
        bar: "right",
        onPress: async input => {
          await submit(input)
        },
      },
    ],
    ...editorOptions,
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
      choices,
    })
  }

  return await global.kitPrompt({
    choices,
    ...placeholderOrConfig,
    hint,
  })
}

global.textarea = async (
  options = {
    value: "",
    placeholder: `${cmd} + s to submit\n${cmd} + w to close`,
    footer: "",
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
  console.clear()
}

let { createNpm } = await import("../api/npm.js")
global.npm = createNpm(appInstall)

global.setPanel = (h, containerClasses = "") => {
  let html = maybeWrapHtml(h, containerClasses)
  global.send(Channel.SET_PANEL, html)
}

global.setFooter = (footer: string) => {
  global.send(Channel.SET_FOOTER, footer)
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

global.setResize = async ignore => {
  global.send(Channel.SET_RESIZE, ignore)
}

global.setValue = async value => {
  global.send(Channel.SET_VALUE, value)
}

global.getDataFromApp = global.sendWait = async (
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

global.clearClipboardHistory = () => {
  global.send(Channel.CLEAR_CLIPBOARD_HISTORY)
}

global.__emitter__ = new EventEmitter()

global.submit = async (value: any) => {
  await global.sendWait(Channel.SET_SUBMIT_VALUE, value)
  // let message: AppMessage = {
  //   channel: Channel.VALUE_SUBMITTED,
  //   state: {
  //     value,
  //   },
  //   pid: process.pid,
  // }
  // global.__emitter__.emit("message", message)
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

global.Key = Key

global.mainScript = async (
  input: string = "",
  tab: string
) => {
  if (process.env.KIT_CONTEXT === "app") {
    setInput(input)
    let m = run(mainScriptPath)
    if (tab) setTab(tab)
    await m
  }
}

let getFileInfo = async (filePath: string) => {
  return applescript(`
  set aFile to (POSIX file "${filePath}") as alias
  info for aFile    
  `)
}

let createPathChoices = async (
  startPath: string,
  {
    dirFilter = (dirent: Dirent) => true,
    dirSort = (a: any, b: any) => 0,
    onlyDirs = false,
  }
) => {
  let dirFiles = await readdir(startPath, {
    withFileTypes: true,
  })
  let dirents = dirFiles.filter(dirFilter)

  let folders = dirents.filter(dirent =>
    dirent.isDirectory()
  )
  let files = onlyDirs
    ? []
    : dirents.filter(dirent => !dirent.isDirectory())

  let mapDirents = (dirents: Dirent[]): Choice[] => {
    return dirents.map(dirent => {
      let fullPath = path.resolve(startPath, dirent.name)
      let { size, mtime } = fs.statSync(fullPath)
      let type = dirent.isDirectory() ? "folder" : "file"
      let description =
        type === "folder"
          ? ""
          : `${filesize(
              size
            )} - Last modified ${formatDistanceToNow(
              mtime
            )} ago`

      return {
        img: kitPath("icons", type + ".svg"),
        name: dirent.name,
        value: fullPath,
        description,
        drag: fullPath,
        mtime,
        size,
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

  let mapped = mapDirents(folders.concat(files))

  return (mapped as any).sort(dirSort)
}

let __pathSelector = async (
  config:
    | string
    | {
        startPath?: string
        onlyDirs?: boolean
      } = home(),
  { showHidden } = { showHidden: false }
) => {
  let startPath = ``
  let onInputHook = null
  let onlyDirs = false
  if (typeof config === "string") startPath = config
  if (typeof config === "object") {
    startPath = config?.startPath || home()
    onlyDirs = config?.onlyDirs || false
  }

  if (
    !startPath.endsWith(path.sep) &&
    (await isDir(startPath))
  )
    startPath += path.sep
  let slashCount = -1

  let lsCurrentDir = async input => {
    if (!input) {
      await mainScript()
    }
    let dirFilter = dirent => {
      if (dirent.name.startsWith(".")) {
        return input.includes(path.sep + ".") || showHidden
      }

      return true
    }

    if (input.startsWith("~")) startPath = home()

    if (input.endsWith(path.sep)) {
      startPath = input
    } else {
      startPath = path.dirname(input)
    }
    let isCurrentDir = await isDir(startPath)
    if (isCurrentDir) {
      try {
        setFilterInput(`[^\/]+$`)
        let choices = await createPathChoices(startPath, {
          dirFilter,
          onlyDirs,
        })
        setChoices(choices)
      } catch {
        setPanel(md(`### Failed to read ${startPath}`))
      }
    } else {
      setPanel(md(`### ${startPath} is not a path`))
    }
  }

  let upDir = dir => {
    setInput(
      startPath.replace(
        new RegExp(`[^${path.sep}]+.$`, "gi"),
        ""
      )
    )
  }

  let downDir = async dir => {
    let targetPath = path.resolve(startPath, dir)
    if (await isDir(targetPath)) {
      setInput(targetPath + path.sep)
    } else {
      submit(targetPath)
    }
  }

  let onInput = async (input, state) => {
    if (onInputHook) onInputHook(input, state)
    // if (input.endsWith(">")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     compareAsc
    //   )
    //   setChoices(choices)
    //   return
    // }
    // if (input.endsWith("<")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     (a, b) => compareAsc(b, a)
    //   )
    //   setChoices(choices)
    //   return
    // }
    // if (input.endsWith(";")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     ()=> 0
    //   )
    //   setChoices(choices)
    //   return
    // }

    if (input.startsWith("~")) {
      setInput(home() + path.sep)
      return
    }

    if (input.endsWith(path.sep + ".")) {
      let choices = await createPathChoices(startPath, {
        dirFilter: () => true,
        onlyDirs,
      })
      setChoices(choices)
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
      setPanel(
        md(`### Create File

<code>${input}</code>`)
      )
    } else {
      setPanel(
        md(`### Create directory

<code>${input}</code>`)
      )
    }
  }

  let onEscape = async () => {
    setInput(``)
    await mainScript()
  }

  let sort = `name`
  let dir = `desc`
  let sorters = {
    date: ({ mtime: a }, { mtime: b }) =>
      dir === `asc` ? compareAsc(a, b) : compareAsc(b, a),
    name: ({ name: a }, { name: b }) =>
      dir === `desc` ? (a > b ? 1 : -1) : a > b ? -1 : 1,
    size: ({ size: a }, { size: b }) =>
      dir === `asc` ? (a > b ? 1 : -1) : a > b ? -1 : 1,
  }
  let createSorter = s => {
    return async () => {
      if (sort !== s) {
        dir = `desc`
      } else {
        dir = dir === `asc` ? `desc` : `asc`
      }

      sort = s
      let dirSort = sorters[s]
      let choices = await createPathChoices(startPath, {
        dirFilter: () => true,
        dirSort,
        onlyDirs,
      })

      setChoices(choices)
    }
  }
  let selectedPath = await arg(
    {
      ...(config as PromptConfig),
      input: startPath,
      onInput,
      onTab,
      onRight,
      onLeft,
      onNoChoices,
      onEscape,
      shortcuts: [
        {
          name: "Sort by name",
          key: `${cmd}+,`,
          onPress: createSorter("date"),
          bar: "right",
        },
        {
          name: "Sort by size",
          key: `${cmd}+.`,
          onPress: createSorter("size"),
          bar: "right",
        },
        {
          name: "Sort by date",
          key: `${cmd}+/`,
          onPress: createSorter("name"),
          bar: "right",
        },
      ],

      // onShortcut: {
      //   [`${cmd}+,`]: {
      //     name: "Sort by name",
      //     handler: createSorter(`name`),
      //   },
      //   [`${cmd}+.`]: {
      //     name: "Sort by size",
      //     handler: createSorter(`size`),
      //   },
      //   [`${cmd}+/`]: {
      //     name: "Sort by date",
      //     handler: createSorter(`date`),
      //   },
      // },
    },
    []
  )

  let hasExtension = path.extname(selectedPath) == ""
  if (hasExtension) {
    let isSelectedPathDir = await isDir(selectedPath)
    let doesPathExist = await pathExists(selectedPath)
    if (!isSelectedPathDir && !doesPathExist) {
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

global.setFocused = (id: string) => {
  send(Channel.SET_FOCUSED, id)
}

global.keyboard = {
  type: async (text: string) => {
    await sendWait(Channel.KEYBOARD_TYPE, text)
  },
  pressKey: async (...keys: Key[]) => {
    await sendWait(Channel.KEYBOARD_PRESS_KEY, keys)
  },
  releaseKey: async (...keys: Key[]) => {
    await sendWait(Channel.KEYBOARD_RELEASE_KEY, keys)
  },
  config: async config => {
    send(Channel.KEYBOARD_CONFIG, config)
  },
}

global.setConfig = async (config: Partial<Config>) => {
  send(Channel.SET_CONFIG, config)
}

global.setStatus = async (status: KitStatus) => {
  send(Channel.SET_STATUS, status)
}

delete process.env?.["ELECTRON_RUN_AS_NODE"]
delete global?.env?.["ELECTRON_RUN_AS_NODE"]
