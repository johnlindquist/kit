import fs from "fs"
import { unlink } from "fs/promises"
import { filesize } from "filesize"

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
  GuideSection,
  KitTheme,
} from "../types/kitapp"

import {
  format,
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
  PROMPT,
} from "../core/enum.js"
import {
  assignPropsTo,
  mainScriptPath,
  cmd,
  defaultShortcuts,
  backToMainShortcut,
  closeShortcut,
  editScriptShortcut,
  formShortcuts,
  argShortcuts,
  smallShortcuts,
  isMac,
  shortcutNormalizer,
  friendlyShortcut,
  appDbPath,
} from "../core/utils.js"
import { keyCodeFromKey } from "../core/keyboard.js"
import { Rectangle } from "../types/electron"
import { Dirent } from "fs"
import { EventEmitter } from "events"

interface DisplayChoicesProps
  extends Partial<PromptConfig> {
  className: string
  state: AppState
}

let promptId = 0

let onExitHandler = () => {}
global.onExit = handler => {
  onExitHandler = handler
}

process.on("beforeExit", () => {
  onExitHandler()
})

let _exec = global.exec
global.exec = (
  command: string,
  options = { shell: true, all: true, cwd: process.cwd() }
) => {
  let child = _exec(command, options)
  if (child?.all) child.all.pipe(process.stdout)
  return child as any
}

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

let truncate = (str: string, length: number) => {
  if (str.length > length) {
    return str.slice(0, length) + "..."
  }
  return str
}

let createOnChoiceFocusDefault = (
  debounceChoiceFocus: number,
  onUserChoiceFocus?: ChannelHandler
) => {
  let _promptId = promptId
  let debouncedChoiceFocus = _.debounce(
    async (input: string, state: AppState = {}) => {
      if (_promptId !== promptId) return
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
          preview = md(`# Failed to render preview... 🤔`)
        }
      }

      if (typeof choice?.preview === "string") {
        preview = choice?.preview
      }

      setPreview(preview)

      if (global?.__currentPromptConfig?.shortcuts) {
        const shortcuts =
          global?.__currentPromptConfig?.shortcuts?.filter(
            shortcut => {
              if (shortcut?.condition) {
                return shortcut.condition(state.focused)
              }
              return true
            }
          )

        if (setShortcuts) setShortcuts(shortcuts)
      }

      if (typeof onUserChoiceFocus === "function")
        onUserChoiceFocus(input, state)
    },
    debounceChoiceFocus
  )
  return debouncedChoiceFocus
}

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
  onChange,
  onEscape,
  onAbandon,
  onBack,
  onForward,
  onUp,
  onDown,
  onTab,
  onChoiceFocus,
  onMessageFocus,
  onBlur,
  onLeft,
  onRight,
  onPaste,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onInit,
  onSubmit,
  onValidationFailed,
  onAudioData,
  state,
  shortcuts,
}: WaitForPromptValueProps) => {
  return new Promise((resolve, reject) => {
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
        if (!data?.state) {
          global.warn(
            `AppMessage failed: ${JSON.stringify(
              data,
              null,
              2
            )}`
          )
          return
        }
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

        switch (data.channel) {
          case Channel.INPUT:
            onInput(data.state.input, data.state)
            break

          case Channel.CHANGE:
            onChange(data.state.input, data.state)
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

          case Channel.MESSAGE_FOCUSED:
            onMessageFocus(data.state.input, data.state)
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

          case Channel.ON_DRAG_ENTER:
            onDragEnter(data.state.input, data.state)
            break

          case Channel.ON_DRAG_LEAVE:
            onDragLeave(data.state.input, data.state)
            break

          case Channel.ON_DRAG_OVER:
            onDragOver(data.state.input, data.state)
            break

          case Channel.ON_INIT:
            onInit(data.state.input, data.state)
            break

          case Channel.ON_SUBMIT:
            onSubmit(data.state.input, data.state)
            break

          case Channel.ON_VALIDATION_FAILED:
            onValidationFailed(data.state.input, data.state)
            break

          case Channel.ON_AUDIO_DATA:
            if (
              typeof data?.state?.value === "string" &&
              data?.state?.value?.startsWith("data:")
            ) {
              log(`Found data.state.value`)
              const [header, content] =
                data.state.value.split(",")
              const [type, encoding] = header.split(";")
              log(`decoding ${encoding} ${type}`)
              if (encoding === "base64") {
                data.state.value = Buffer.from(
                  content,
                  "base64"
                )
              }
            }
            onAudioData(data.state.input, data.state)
            break
        }
      },
      // TODO: Add a kit log
      // TODO: Why abandon on CLI?
      complete: () => {
        // global.log(
        //   `${process.pid}: ✂️  Remove all handlers`
        // )
      },
    })

    value$.subscribe({
      next: value => {
        if (value?.data) {
          console.log(`Found value.data`)
          value = value.data
        }
        if (
          typeof value === "string" &&
          value.startsWith("data:")
        ) {
          const [header, content] = value.split(",")
          const [type, encoding] = header.split(";")

          log(`decoding ${encoding} ${type}`)

          if (encoding === "base64") {
            value = Buffer.from(content, "base64")
          }
        }
        resolve(value)
      },
      complete: () => {
        // global.log(
        //   `${process.pid}: Prompt #${promptId} complete 👍`
        // )
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
let onMessageFocusDefault = async () => {}
let onPasteDefault = async (input, state) => {
  if (state.paste) setSelectedText(state.paste, false)
}
let onDropDefault = async (input, state) => {
  log(`onDrop`)
  if (state.drop && state.ui === UI.arg) {
    setInput(state.drop)
  }
  await focus()
}

let onDragEnterDefault = async (input, state) => {
  log(`onDragEnter`)
}
let onDragLeaveDefault = async (input, state) => {
  log(`onDragLeave`)
}
let onDragOverDefault = async (input, state) => {
  log(`onDragOver`)
}

let onInitDefault = async (input, state) => {}
let onSubmitDefault = async (input, state) => {}
let onValidationFailedDefault = async (input, state) => {}
let onAudioDataDefault = async (input, state) => {}

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
    resize: false,
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
        ? await (panel as Function)()
        : (panel as string),
    preview:
      preview && typeof preview === "function"
        ? await (preview as Function)()
        : (preview as string),
    env: config?.env || global.env,
    choicesType: determineChoicesType(choices),
    hasOnNoChoices: Boolean(config?.onNoChoices),
    inputCommandChars: config?.inputCommandChars || [],
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
  let _promptId = promptId
  return _.debounce(async (input, state) => {
    if (_promptId !== promptId) return
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

let onChangeDefault = () => {}

let determineChoicesType = choices => {
  if (!choices) return "null"
  if (typeof choices === "function") {
    if (choices.constructor.name === "AsyncFunction")
      return "async"
    return "function"
  } else if (Array.isArray(choices)) {
    return "array"
  } else if (typeof choices === "string") {
    return "string"
  }
}

global.__currentPromptSecret = false
global.__currentPromptConfig = {}
global.kitPrompt = async (config: PromptConfig) => {
  promptId++
  global.__currentPromptSecret = config.secret || false
  global.currentUI = config?.ui || UI.arg
  kitPrompt$.next(true)

  //need to let onTabs() gather tab names. See Word API

  await new Promise(r => setTimeout(r, 0))

  config.shortcuts ||= []
  config.width ||= PROMPT.WIDTH.DEFAULT

  // if (!config.shortcuts.find(s => s.key === `escape`)) {
  //   config.shortcuts.push({
  //     ...backToMainShortcut,
  //     bar: "",
  //   })
  // }

  if (!config.shortcuts.find(s => s.key === `${cmd}+o`)) {
    config.shortcuts.push({
      ...editScriptShortcut,
      bar: "",
    })
  }

  if (!config.shortcuts.find(s => s.key === `${cmd}+w`)) {
    config.shortcuts.push({
      ...closeShortcut,
      bar: "",
    })
  }

  let {
    input = "",
    choices = ``,
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
    onMessageFocus = onMessageFocusDefault,
    debounceInput = 200,
    onInput = createOnInputDefault(
      choices,
      className,
      debounceInput
    ),
    onChange = onChangeDefault,
    onBlur = onBlurDefault,
    onPaste = onPasteDefault,
    onDrop = onDropDefault,
    onDragEnter = onDragEnterDefault,
    onDragLeave = onDragLeaveDefault,
    onDragOver = onDragOverDefault,
    onInit = onInitDefault,
    onSubmit = onSubmitDefault,
    onValidationFailed = onValidationFailedDefault,
    onAudioData = onAudioDataDefault,
  } = config

  global.__currentPromptConfig = config
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
    onChange,
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
    onMessageFocus,
    onBlur,
    onPaste,
    onDrop,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onInit,
    onSubmit,
    onValidationFailed,
    onAudioData,
    shortcuts: config.shortcuts,
    state: { input },
  })
}

global.drop = async (
  placeholder = "Drop something here..."
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
    enter: "",
    shortcuts: [backToMainShortcut, closeShortcut],
    ...config,
    ignoreBlur: true,
  })
}

global.emoji = async (config?: PromptConfig) => {
  return await global.kitPrompt({
    ui: UI.emoji,
    enter: "Select",
    shortcuts: [backToMainShortcut],
    ignoreBlur: true,
    width: 350,
    height: 510,
    ...config,
  })
}

global.showEmojiPanel = () => {
  send(Channel.SHOW_EMOJI_PANEL)
}

global.fields = async formFields => {
  let config: PromptConfig & { fields?: Field[] } = {}
  let f = []
  if (Array.isArray(formFields) && !formFields[0]?.fields) {
    f = formFields
  } else {
    config = formFields
    f = config?.fields
  }

  let inputs = f
    .map((field, i) => {
      let defaultElement: any = {
        element: "input",
        label: "Label",
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
                  class="peer text-xl h-10 px-4 py-0 outline-none border-b border-opacity-25 placeholder-text-base placeholder-opacity-25 border-text-base border-opacity-15 focus:border-primary w-full"/>

                  <label for=${id || i} htmlFor=${
        id || i
      } class="text-sm px-4 block font-normal text-text-base text-opacity-75 peer-focus:text-primary peer-focus:text-opacity-90">
                          ${label}
                        </label>
          </div>
      
      `
    })
    .join("")
  config.html = `<div class="flex flex-col items-center min-h-full flex-1 w-full">

${inputs}

<div class="w-full px-4 invisible h-0">
<input type="reset" name="reset-form" value="Reset" accesskey="r"> class="focus:underline underline-offset-4 outline-none p-3 dark:text-white text-opacity-50 dark:text-opacity-50 font-medium text-sm focus:text-text-base dark:focus:text-primary-light  hover:text-text-base dark:hover:text-primary-light hover:underline dark:hover:underline"/>
<input type="submit" name="submit-form" value="Submit" class="focus:underline underline-offset-4 outline-none p-3 text-contrast-dark dark:text-contrast-light text-opacity-75 dark:text-opacity-75 font-medium text-sm focus:text-text-base dark:focus:text-primary-light hover:text-text-base dark:hover:text-primary-light hover:underline dark:hover:underline bg-opacity-75 dark:bg-opacity-75"/>
</div>
</div>`
  config.shortcuts = formShortcuts

  config.enter ||= "Submit"
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
  config.enter ||= "Submit"
  config.shortcuts ||= formShortcuts

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

let maybeWrapHtml = (html = "", containerClasses = "") => {
  return containerClasses?.length === 0
    ? html
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
    enter: `Continue`,
    shortcuts: [backToMainShortcut],
    ...config,
    choices: maybeWrapHtml(config?.html, containerClasses),
    ui: UI.div,
  })
}

global.docs = async (filePath: string, options = {}) => {
  let fileMarkdown = await readFile(filePath, "utf-8")
  let lexer = new marked.Lexer()
  let tokens = lexer.lex(fileMarkdown)

  let sections: GuideSection[] = []
  let placeholder = ""
  for (let token of tokens) {
    if (token.type === "heading" && token.depth === 1) {
      setName(token.text)
      placeholder = token.text
      continue
    }

    if (token.type === "heading" && token.depth === 2) {
      sections.push({
        name: token.text,
        raw: `# ${token.text}\n\n`,
        comments: {},
      })
    } else if (
      sections.length &&
      token.type === "html" &&
      token.text.startsWith("<!--")
    ) {
      let [key, value] = token.text
        .replace(/<!--(.*)-->/, "$1")
        .trim()
        // Only split on the first colon and filter out empty strings
        .split(/:(.+)/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

      sections[sections.length - 1].comments[key.trim()] =
        value.trim()
    } else if (sections.length) {
      sections[sections.length - 1].raw += token.raw
    }
  }

  let config =
    typeof options === "function"
      ? await options(sections, tokens)
      : options

  let containerClasses =
    "p-5 prose dark:prose-dark prose-sm"

  let choices = sections.map(section => {
    return {
      name: section.name,
      preview: async () =>
        highlight(section.raw, containerClasses),
      value: section?.comments?.value || section?.name,
      ...section.comments,
    }
  })

  return await arg(
    {
      placeholder,
      ...config,
    },
    choices
  )
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
    language: "markdown",
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
    shortcuts: defaultShortcuts,
    ...editorOptions,
    enter: "",
  })
}

global.editor.setSuggestions = async (
  suggestions: string[] = []
) => {
  await sendWait(
    Channel.SET_EDITOR_SUGGESTIONS,
    suggestions
  )
}

global.editor.setConfig = async (config: EditorOptions) => {
  await sendWait(Channel.SET_EDITOR_CONFIG, config)
}

global.editor.append = async (value: string) => {
  await sendWait(Channel.APPEND_EDITOR_VALUE, value)
}

global.template = async (
  template: string = "",
  options: EditorOptions = { language: "plaintext" }
) => {
  return global.editor({
    template,
    ...options,
    enter: "",
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
    shortcuts: [backToMainShortcut],
    enter: "",
    ui: UI.hotkey,
  })
}

global.arg = async (
  placeholderOrConfig = "Type a value:",
  choices = ``
) => {
  if (!choices) {
    setChoices([])
    setPanel(``)
  }
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

  let promptConfig: PromptConfig = {
    ui: UI.arg,
    enter: "Submit",
    hint,
    shortcuts: (placeholderOrConfig as PromptConfig)?.resize
      ? smallShortcuts
      : argShortcuts,
    choices,
  }

  if (
    Array.isArray(choices) &&
    !(choices as Choice[]).find(c => c?.preview)
  ) {
    promptConfig.resize ??= true
  }

  if (typeof placeholderOrConfig === "string") {
    promptConfig.placeholder = placeholderOrConfig
  }

  if (typeof placeholderOrConfig === "object") {
    promptConfig = {
      ...promptConfig,
      ...placeholderOrConfig,
    }
  }

  return await global.kitPrompt(promptConfig)
}

global.chat = async (options = {}) => {
  let messages = await global.kitPrompt({
    placeholder: "",
    ignoreBlur: true,
    ui: UI.chat,
    enter: "",
    shortcuts: [
      {
        name: "Done",
        key: `${cmd}+enter`,
        onPress: async () => {
          let messages = await chat.getMessages()
          submit(messages)
        },
        bar: "right",
      },
    ],
    ...options,
  })

  return messages
}

global.chat.addMessage = async (message = {}) => {
  if (typeof message === "string") {
    message = { text: message }
  }
  let messageDefaults = {
    type: "text",
    position: "left",
    text: "",
  }
  await sendWait(Channel.CHAT_ADD_MESSAGE, {
    ...messageDefaults,
    ...message,
  })
}

global.chat.getMessages = async () => {
  return await sendWait(Channel.CHAT_GET_MESSAGES)
}

global.chat.setMessages = async (messages = []) => {
  await sendWait(Channel.CHAT_SET_MESSAGES, messages)
}

global.chat.pushToken = async (token: string = "") => {
  await sendWait(Channel.CHAT_PUSH_TOKEN, token)
}

global.chat.setMessage = async (
  index: number,
  message = ""
) => {
  if (typeof message === "string") {
    message = { text: message }
  }
  let messageDefaults = {
    type: "text",
    position: "left",
    text: "",
  }
  await sendWait(Channel.CHAT_SET_MESSAGE, {
    index,
    message: {
      ...messageDefaults,
      ...message,
    },
  })
}

global.textarea = async (options = "") => {
  let config =
    typeof options === "string"
      ? { value: options }
      : options

  return await global.kitPrompt({
    ui: UI.textarea,
    ignoreBlur: true,
    enter: "",
    shortcuts: defaultShortcuts,
    ...config,
    input: config?.value || config?.input || "",
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

    let stripVersion = packageName.replace(
      /(?<=.)(@|\^|~).*/g,
      ""
    )
    let packageLink = `https://npmjs.com/package/${stripVersion}`

    let response = null
    try {
      response = await get<{ downloads: number }>(
        `https://api.npmjs.org/downloads/point/last-week/` +
          stripVersion
      )
    } catch (error) {}

    let downloads =
      response?.data?.downloads || `an unknown number of`

    let preview = md(
      `[${stripVersion}](${packageLink}) has had ${downloads} downloads from npm in the past week`
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
  // setLoading(false)
}

global.setHint = async hint => {
  global.send(Channel.SET_HINT, hint)
}

global.setInput = async input => {
  return await global.sendWait(Channel.SET_INPUT, input)
}

global.appendInput = async text => {
  return await global.sendWait(Channel.APPEND_INPUT, text)
}

global.scrollTo = async location => {
  return await global.sendWait(Channel.SCROLL_TO, location)
}

global.setFilterInput = async inputFilter => {
  global.send(Channel.SET_FILTER_INPUT, inputFilter)
}

global.setIgnoreBlur = async ignore => {
  return global.sendWait(Channel.SET_IGNORE_BLUR, ignore)
}

global.setResize = async ignore => {
  global.send(Channel.SET_RESIZE, ignore)
}

global.setValue = async value => {
  global.send(Channel.SET_VALUE, value)
}

global.getDataFromApp = global.sendWait = async (
  channel: GetAppData,
  data?: any
) => {
  if (process?.send) {
    return await new Promise((res, rej) => {
      let messageHandler = data => {
        if (data.channel === channel) {
          res(
            typeof data?.value === "undefined"
              ? data
              : data?.value
          )
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

global.setBounds = async (bounds: Partial<Rectangle>) => {
  await global.sendWait(Channel.SET_BOUNDS, bounds)
}

global.getClipboardHistory = async () =>
  (
    await global.getDataFromApp(
      Channel.GET_CLIPBOARD_HISTORY
    )
  )?.history

global.removeClipboardItem = (id: string) => {
  return global.sendWait(
    Channel.REMOVE_CLIPBOARD_HISTORY_ITEM,
    id
  )
}

global.clearClipboardHistory = () => {
  return global.sendWait(Channel.CLEAR_CLIPBOARD_HISTORY)
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
  "applescript",
  "download",
  "exec",
  "fetch",
  "get",
  "patch",
  "post",
  "put",
  "del",
  "wait",
  "say",
  "playAudioFile",
]
for (let method of loadingList) {
  let original = global[method]
  global[method] = function (...args: any[]) {
    setLoading(true)
    let result = original.apply(this, args)
    result.then(() => setLoading(false))
    return result
  }
}

global.Key = Key

global.mainScript = async (
  input: string = "",
  tab: string
) => {
  if (process.env.KIT_CONTEXT === "app") {
    clearAllTimeouts()
    clearAllIntervals()
    setInput(input)
    let m = run(mainScriptPath)
    if (tab) {
      await wait(200)
      setTab(tab)
    }
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

let verifyFullDiskAccess = async () => {
  return global.sendWait(Channel.VERIFY_FULL_DISK_ACCESS)
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
  await setIgnoreBlur(true)
  await setAlwaysOnTop(true)

  let startPath = ``
  let focusOn = ``
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
        return input?.includes(path.sep + ".") || showHidden
      }

      return true
    }

    if (input?.startsWith("~")) startPath = home()

    if (input?.endsWith(path.sep)) {
      startPath = input
    } else {
      startPath = path.dirname(input)
    }
    let isCurrentDir = await isDir(startPath)
    if (isCurrentDir) {
      try {
        let filterInput = `[^\\${path.sep}]+$`
        setFilterInput(filterInput)
        let choices = await createPathChoices(startPath, {
          dirFilter,
          onlyDirs,
        })
        await setChoices(choices)
        if (focusOn) setFocused(focusOn)
        focusOn = ``
      } catch {
        setPanel(md(`### Failed to read ${startPath}`))
      }
    } else {
      setPanel(md(`### ${startPath} is not a path`))
    }
  }

  let upDir = async dir => {
    await setInput(path.dirname(startPath) + path.sep)
    if (dir) focusOn = path.basename(path.dirname(dir))
  }

  let downDir = async dir => {
    let targetPath = path.resolve(startPath, dir)
    let allowed = true
    let needsPermission =
      targetPath === home("Downloads") ||
      targetPath === home("Documents") ||
      targetPath === home("Desktop")

    if (needsPermission && isMac) {
      let testFile = createPathResolver(targetPath)(
        `._kit_test_file_${Date.now()}.txt`
      )
      await writeFile(testFile, `success`)
      allowed = await isFile(testFile)
      if (allowed) {
        global.log(`Access granted to ${targetPath}`)
        await unlink(testFile)
      }
    }

    if (allowed) {
      if (await isDir(targetPath)) {
        setInput(targetPath + path.sep)
      } else {
        submit(targetPath)
      }
    } else {
      let html = md(`
## Unable to Access Folder

Kit needs permission to access \`${targetPath}\`. 

Please grant permission in System Preferences > Security & Privacy > Privacy > Files and Folders (or Full Disk Access).
`)

      await div({
        html,
        ignoreBlur: true,
        enter: "Back to Main",
        shortcuts: [
          {
            name: "Quit",
            key: `${cmd}+q`,
            bar: "right",
            onPress: async () => {
              send(Channel.QUIT_APP)
            },
          },
        ],
      })

      await mainScript()
    }
  }

  let onInput = async (input, state) => {
    setEnter("Select")
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

    if (!input) return

    if (input?.startsWith("~")) {
      setInput(home() + path.sep)
      return
    }

    if (input?.endsWith(path.sep + ".")) {
      let choices = await createPathChoices(startPath, {
        dirFilter: () => true,
        onlyDirs,
      })
      setChoices(choices)
      if (focusOn) setFocused(focusOn)
      focusOn = ``
      return
    }
    let currentSlashCount = input?.split(path.sep).length
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
      setEnter("Create File")
      setPanel(
        md(`# Create and Select This File

> <code>${input}</code>`)
      )
    } else {
      setEnter("Create Folder")
      setPanel(
        md(`# Create and Select This Folder

> <code>${input}</code>`)
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
  let createSorter = (s: "date" | "name" | "size") => {
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
      inputCommandChars: ["/", "."],
      input: startPath,
      onInput,
      onTab,
      // onRight,
      // onLeft,
      onNoChoices,
      onEscape,
      enter: "Select",
      // TODO: If I want resize, I need to create choices first?
      resize: false,
      shortcuts: [
        {
          name: "Out",
          key: "left",
          bar: "right",
          onPress: onLeft,
        },
        {
          name: "In",
          key: "right",
          bar: "right",
          onPress: onRight,
        },
        {
          name: "Name",
          key: `${cmd}+,`,
          onPress: createSorter("name"),
          bar: "right",
        },
        {
          name: "Size",
          key: `${cmd}+.`,
          onPress: createSorter("size"),
          bar: "right",
        },
        {
          name: "Date",
          key: `${cmd}+/`,
          onPress: createSorter("date"),
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

  let doesPathExist = await pathExists(selectedPath)
  if (!doesPathExist) {
    if (path.extname(selectedPath)) {
      await ensureFile(selectedPath)
    } else {
      await ensureDir(selectedPath)
    }
  }

  return selectedPath.trim()
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
  type: async (...textOrKeys: (string | Key)[]) => {
    await sendWait(Channel.KEYBOARD_TYPE, textOrKeys)
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

global.clipboard = {
  readText: async () => {
    return await sendWait(Channel.CLIPBOARD_READ_TEXT)
  },
  readHTML: async () => {
    return await sendWait(Channel.CLIPBOARD_READ_HTML)
  },
  readImage: async () => {
    let tmpPath = await sendWait(
      Channel.CLIPBOARD_READ_IMAGE
    )
    return await readFile(tmpPath)
  },
  readRTF: async () => {
    return await sendWait(Channel.CLIPBOARD_READ_RTF)
  },
  readBookmark: async () => {
    return await sendWait(Channel.CLIPBOARD_READ_BOOKMARK)
  },
  readFindText: async () => {
    return await sendWait(Channel.CLIPBOARD_READ_FIND_TEXT)
  },
  writeText: async (text: string) => {
    return await sendWait(
      Channel.CLIPBOARD_WRITE_TEXT,
      text
    )
  },
  writeHTML: async (html: string) => {
    return await sendWait(
      Channel.CLIPBOARD_WRITE_HTML,
      html
    )
  },
  writeImage: async (image: Buffer) => {
    let imagePath = tmpPath(`${uuid()}.png`)
    await writeFile(imagePath, image)
    return await sendWait(
      Channel.CLIPBOARD_WRITE_IMAGE,
      imagePath
    )
  },
  writeRTF: async (rtf: string) => {
    return await sendWait(Channel.CLIPBOARD_WRITE_RTF, rtf)
  },
  writeBookmark: async (bookmark: {
    url: string
    title: string
  }) => {
    return await sendWait(
      Channel.CLIPBOARD_WRITE_BOOKMARK,
      bookmark
    )
  },
  writeFindText: async (findText: string) => {
    return await sendWait(
      Channel.CLIPBOARD_WRITE_FIND_TEXT,
      findText
    )
  },

  clear: async () => {
    return await sendWait(Channel.CLIPBOARD_CLEAR)
  },
}

global.setConfig = async (config: Partial<Config>) => {
  send(Channel.SET_CONFIG, config)
}

global.setStatus = async (status: KitStatus) => {
  send(Channel.SET_STATUS, status)
}

global.setTheme = async (theme: KitTheme) => {
  await sendWait(Channel.SET_THEME, theme)
}

global.setScriptTheme = async (theme: KitTheme) => {
  await sendWait(Channel.SET_TEMP_THEME, theme)
}

global.setAlwaysOnTop = async (alwaysOnTop: boolean) => {
  return sendWait(Channel.SET_ALWAYS_ON_TOP, alwaysOnTop)
}

global.focus = async () => {
  return sendWait(Channel.FOCUS)
}

delete process.env?.["ELECTRON_RUN_AS_NODE"]
delete global?.env?.["ELECTRON_RUN_AS_NODE"]

type ExtraLib = { content: string; filePath: string }

let addNodeLibs = async () => {
  let extraLibs: ExtraLib[] = []
  let nodeTypesDir = kitPath(
    "node_modules",
    "@types",
    "node"
  )
  let nodeDirents = await readdir(nodeTypesDir, {
    withFileTypes: true,
  })

  for await (let dirent of nodeDirents) {
    if (dirent.isDirectory()) {
      let { name } = dirent
      let subDirent = await readdir(
        path.resolve(nodeTypesDir, name),
        {
          withFileTypes: true,
        }
      )

      for await (let sub of subDirent) {
        if (sub.isFile() && sub.name.endsWith(".d.ts")) {
          let filePath = path.resolve(
            nodeTypesDir,
            name,
            sub.name
          )
          let content = await readFile(filePath, "utf8")
          extraLibs.push({
            content,
            filePath: `file:///${name}/${sub.name}`,
          })
        }
      }
    } else {
      let { name } = dirent
      if (name.endsWith("d.ts")) {
        let content = await readFile(
          kitPath("node_modules", "@types", "node", name),
          "utf8"
        )
        extraLibs.push({
          content,
          filePath: `file:///${name}`,
        })
      }
    }
  }

  return extraLibs
}

let addKitLibs = async (): Promise<ExtraLib[]> => {
  let extraLibs: ExtraLib[] = []
  //   let utilsContent = await readFile(
  //     kitPath("core", "utils.d.ts"),
  //     "utf8"
  //   )
  //   let enumsContent = await readFile(
  //     kitPath("core", "enum.d.ts"),
  //     "utf8"
  //   )
  //   extraLibs.push({
  //     content: `declare module "@johnlindquist/kit" {
  //       ${utilsContent}
  //       ${enumsContent}
  // }`,
  //     filePath: `file:///node_modules/@types/@johnlindquist/kit/index.d.ts`,
  //   })
  let kitCoreDir = kitPath("core")
  let kitCoreTypes = await readdir(kitCoreDir)

  for await (let t of kitCoreTypes.filter(t =>
    t.endsWith(".d.ts")
  )) {
    let content = await readFile(kitPath("core", t), "utf8")

    extraLibs.push({
      content,
      filePath: `file:///core/${t}`,
    })
  }

  let kitTypesDir = kitPath("types")
  let kitTypes = await readdir(kitTypesDir)

  for await (let t of kitTypes) {
    let content = await readFile(
      kitPath("types", t),
      "utf8"
    )

    extraLibs.push({
      content,
      filePath: `file:///types/${t}`,
    })
  }

  let globalTypesDir = kitPath(
    "node_modules",
    "@johnlindquist",
    "globals",
    "types"
  )

  let globalTypeDirs = (
    await readdir(globalTypesDir, { withFileTypes: true })
  ).filter(dir => dir.isDirectory())

  for await (let { name } of globalTypeDirs) {
    let content = await readFile(
      kitPath(
        "node_modules",
        "@johnlindquist",
        "globals",
        "types",
        name,
        "index.d.ts"
      ),
      "utf8"
    )

    // let filePath = `file:///node_modules/@johnlindquist/globals/${name}/index.d.ts`
    let filePath = `file:///node_modules/@johnlindquist/globals/${name}/index.d.ts`

    extraLibs.push({
      content,
      filePath,
    })
  }

  let lodashCommonDir = kitPath(
    "node_modules",
    "@johnlindquist",
    "globals",
    "types",
    "lodash",
    "common"
  )

  let lodashCommon = await readdir(lodashCommonDir)

  for await (let name of lodashCommon) {
    let content = await readFile(
      kitPath(
        "node_modules",
        "@johnlindquist",
        "globals",
        "types",
        "lodash",
        "common",
        name
      ),
      "utf8"
    )

    // let filePath = `file:///node_modules/@johnlindquist/globals/${lib}/index.d.ts`
    let filePath = `file:///node_modules/@johnlindquist/globals/lodash/common/${name}`

    extraLibs.push({
      content,
      filePath,
    })
  }

  // node_modules/@johnlindquist/globals/types/index.d.ts
  let globalsIndexContent = await readFile(
    kitPath(
      "node_modules",
      "@johnlindquist",
      "globals",
      "types",
      "index.d.ts"
    ),
    "utf8"
  )

  //   globalsIndexContent = `declare module "@johnlindquist/globals" {
  // ${globalsIndexContent}
  //   }`

  extraLibs.push({
    content: globalsIndexContent,
    filePath: `file:///node_modules/@johnlindquist/globals/index.d.ts`,
  })

  // let content = await readFile(
  //   kitPath("types", "kit-editor.d.ts"),
  //   "utf8"
  // )
  // extraLibs.push({
  //   content,
  //   filePath: `file:///kit.d.ts`,
  // })

  let shelljsContent = await readFile(
    kitPath(
      "node_modules",
      "@types",
      "shelljs",
      "index.d.ts"
    ),
    "utf8"
  )

  extraLibs.push({
    content: shelljsContent,
    filePath: `file:///node_modules/@types/shelljs/index.d.ts`,
  })

  // let reactContent = await readFile(
  //   kitPath(
  //     "node_modules",
  //     "@types",
  //     "react",
  //     "index.d.ts"
  //   ),
  //   "utf8"
  // )

  // extraLibs.push({
  //   content: reactContent,
  //   filePath: `react`,
  // })

  let nodeNotifierContent = await readFile(
    kitPath(
      "node_modules",
      "@types",
      "node-notifier",
      "index.d.ts"
    ),
    "utf8"
  )

  extraLibs.push({
    content: nodeNotifierContent,
    filePath: `file:///node_modules/@types/node-notifier/index.d.ts`,
  })

  let trashContent = await readFile(
    kitPath("node_modules", "trash", "index.d.ts"),
    "utf8"
  )

  extraLibs.push({
    content: trashContent,
    filePath: `file:///node_modules/@types/trash/index.d.ts`,
  })

  return extraLibs
}

global.getExtraLibs = async (): Promise<ExtraLib[]> => {
  let nodeLibs = []
  try {
    nodeLibs = await addNodeLibs()
  } catch (error) {
    warn(error)
  }

  let kitLibs = []
  try {
    kitLibs = await addKitLibs()
  } catch (error) {
    warn(error)
  }
  return [...nodeLibs, ...kitLibs]
}

global.setAppearance = async appearance => {
  await sendWait(Channel.SET_APPEARANCE, appearance)
}

global.setShortcuts = async shortcuts => {
  await sendWait(Channel.SET_SHORTCUTS, shortcuts)
}

global.getAppState = async () => {
  return await sendWait(Channel.GET_APP_STATE)
}

global.formatDate = format
global.formatDateToNow = formatDistanceToNow

process.addListener("unhandledRejection", async error => {
  if (global.errorPrompt)
    await global.errorPrompt(error as Error)
})

process.addListener("uncaughtException", async error => {
  if (global.errorPrompt)
    await global.errorPrompt(error as Error)
})

let __kit__registeredShortcuts = new Map()
global.__kit__onShortcutPressed = async (
  input: string,
  state: AppState
) => {
  let callback = __kit__registeredShortcuts.get(input)
  if (callback) callback(input, state)
}

global.registerShortcut = async (
  shortcut: string,
  callback: () => void
) => {
  if (process?.send) {
    let result = await sendWait(
      Channel.REGISTER_GLOBAL_SHORTCUT,
      shortcut
    )

    log({ result })
    if (!result) {
      warn(
        `Shortcut ${shortcut} failed to register. Ending process. 😰`
      )
      exit()
    }
    let messageHandler = (data: any) => {
      if (
        data.channel === Channel.GLOBAL_SHORTCUT_PRESSED &&
        data.value === shortcut
      ) {
        callback()
      }
    }
    __kit__registeredShortcuts.set(shortcut, messageHandler)
    process.on("message", messageHandler)
    process.on("beforeExit", () => {
      global.unregisterShortcut(shortcut)
    })
  }
}

global.unregisterShortcut = async (shortcut: string) => {
  sendWait(Channel.UNREGISTER_GLOBAL_SHORTCUT, shortcut)
  let messageHandler =
    __kit__registeredShortcuts.get(shortcut)
  if (messageHandler) {
    process.off("message", messageHandler)
    __kit__registeredShortcuts.delete(shortcut)
  }
}

global.startDrag = async (
  filePath: string,
  iconPath: string
) => {
  await sendWait(Channel.START_DRAG, { filePath, iconPath })
}

global.eyeDropper = async () => {
  return await sendWait(Channel.GET_COLOR)
}

/**
 * @experimental - API, types, etc TBD
 *
 */
global.toast = async (text: string, options: any = {}) => {
  return await sendWait(Channel.TOAST, {
    text,
    options,
  })
}

global.mic = async () => {
  return await global.kitPrompt({
    ui: UI.mic,
    enter: "Stop Recording",
    shortcuts: [backToMainShortcut, closeShortcut],
    ignoreBlur: true,
  })
}

global.webcam = async () => {
  return await global.kitPrompt({
    ui: UI.webcam,
    enter: "Stop Recording",
    shortcuts: [backToMainShortcut, closeShortcut],
    ignoreBlur: true,
  })
}

global.speech = async () => {
  return await global.kitPrompt({
    ui: UI.speech,
    enter: "Stop Recording",
    shortcuts: [backToMainShortcut, closeShortcut],
    ignoreBlur: true,
  })
}

global.getDevices = async () => {
  let appMessage = await sendWait(Channel.GET_DEVICES)

  return appMessage?.state?.value
}

global.PROMPT = PROMPT
