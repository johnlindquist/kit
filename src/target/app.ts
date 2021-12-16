import {
  Choice,
  PromptConfig,
  PromptData,
} from "../types/core"

import {
  GetAppData,
  EditorConfig,
  KeyData,
} from "../types/kitapp"

import {
  filter,
  map,
  merge,
  Observable,
  of,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
  debounceTime,
  withLatestFrom,
  Subject,
} from "@johnlindquist/kit-internal/rxjs"
import { minimist } from "@johnlindquist/kit-internal/minimist"
import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Mode, Channel, UI } from "../core/enum.js"
import {
  assignPropsTo,
  mainScriptPath,
} from "../core/utils.js"
import {
  KeyEnum,
  keyCodeFromKey,
} from "../core/keyboard.js"
import { Rectangle } from "../types/electron"
import { result } from "@johnlindquist/globals/types/lodash"

interface AppMessage {
  channel: Channel
  value?: any
  input?: string
  tab?: string
  flag?: string
  index?: number
  id?: string
  pid?: number
}

interface DisplayChoicesProps {
  choices: PromptConfig["choices"]
  className: string
  onNoChoices: PromptConfig["onNoChoices"]
  onChoices: PromptConfig["onChoices"]
  input: string
}
let displayChoices = async ({
  choices,
  className,
  onNoChoices,
  onChoices,
  input,
}: DisplayChoicesProps) => {
  switch (typeof choices) {
    case "string":
      global.setPanel(choices, className)
      break

    case "object":
      let resultChoices = checkResultInfo(choices)

      global.setChoices(resultChoices, className)

      if (
        resultChoices?.length > 0 &&
        typeof onChoices === "function"
      ) {
        await onChoices(input)
      }

      if (
        resultChoices?.length === 0 &&
        input?.length > 0 &&
        typeof onNoChoices === "function"
      ) {
        await onNoChoices(input)
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

let promptId = 0

interface PromptContext {
  promptId: number
  tabIndex: number
}
interface InvokeChoicesProps extends DisplayChoicesProps {
  ct: PromptContext
}
let invokeChoices = async (props: InvokeChoicesProps) => {
  if (Array.isArray(props.choices)) {
    displayChoices(props)
    return props.choices
  }
  let resultOrPromise = (props.choices as Function)(
    props.input
  )

  if (resultOrPromise && resultOrPromise.then) {
    let result = await resultOrPromise

    if (
      props.ct.promptId === promptId &&
      props.ct.tabIndex === global.onTabIndex
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

let waitForPromptValue = ({
  choices,
  validate,
  className,
  onNoChoices,
  onChoices,
}: WaitForPromptValueProps) => {
  return new Promise((resolve, reject) => {
    promptId++
    let ct = {
      promptId,
      tabIndex: global.onTabIndex,
    }

    let process$ = new Observable<AppMessage>(observer => {
      let m = (data: AppMessage) => {
        observer.next(data)
      }
      let e = (error: Error) => {
        observer.error(error)
      }
      process.on("message", m)
      process.on("error", e)
      return () => {
        process.off("message", m)
        process.off("error", e)
      }
    }).pipe(takeUntil(kitPrompt$), share())

    let tab$ = process$.pipe(
      filter(data => data.channel === Channel.TAB_CHANGED),
      filter(data => {
        let tabIndex = global.onTabs.findIndex(
          ({ name }) => {
            return name == data?.tab
          }
        )

        return tabIndex !== global.onTabIndex
      }),
      tap(data => {
        let tabIndex = global.onTabs.findIndex(
          ({ name }) => {
            return name == data?.tab
          }
        )

        // console.log(`\nUPDATING TAB: ${tabIndex}`)
        global.onTabIndex = tabIndex
        global.currentOnTab = global.onTabs?.[tabIndex]?.fn(
          data?.input
        )
      }),
      share()
    )

    let message$ = process$.pipe(takeUntil(tab$))

    let valueSubmitted$ = message$.pipe(
      filter(
        data => data.channel === Channel.VALUE_SUBMITTED
      ),
      share()
    )

    let value$ = valueSubmitted$.pipe(
      tap(data => {
        if (data.flag) {
          global.flag[data.flag] = true
        }
      }),
      switchMap(async ({ value, id }) => {
        let choice = (global.kitPrevChoices || []).find(
          (c: Choice) => c.id === id
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

    let generate$ = message$.pipe(
      filter(
        data => data.channel === Channel.GENERATE_CHOICES
      ),
      takeUntil(value$),
      switchMap(data =>
        of(data.input).pipe(
          switchMap(input => {
            let ct = {
              promptId,
              tabIndex: +Number(global.onTabIndex),
            }

            return invokeChoices({
              ct,
              choices,
              className,
              onNoChoices,
              onChoices,
              input,
            })
          })
        )
      ),
      share()
    )

    let blur$ = message$.pipe(
      filter(
        data => data.channel === Channel.PROMPT_BLURRED
      ),
      takeUntil(value$),
      share()
    )

    blur$.subscribe(() => {
      exit()
    })

    let onChoices$ = message$.pipe(
      filter(data =>
        [Channel.CHOICES, Channel.NO_CHOICES].includes(
          data.channel
        )
      ),
      switchMap(x => of(x)),
      takeUntil(value$),
      share()
    )

    onChoices$.subscribe(async data => {
      switch (data.channel) {
        case Channel.CHOICES:
          await onChoices(data.input)
          break
        case Channel.NO_CHOICES:
          await onNoChoices(data.input)
          break
      }
    })

    generate$.subscribe()

    let initialChoices$ = of<InvokeChoicesProps>({
      ct,
      choices,
      className,
      input: "",
      onNoChoices,
      onChoices,
    }).pipe(
      // filter(() => ui === UI.arg),
      switchMap(getInitialChoices),
      share()
    )

    let choice$ = message$.pipe(
      filter(
        data => data.channel === Channel.CHOICE_FOCUSED
      ),
      share()
    )

    choice$
      .pipe(
        takeUntil(value$),
        switchMap(async data => {
          let choice = (global.kitPrevChoices || []).find(
            (c: Choice) => c.id === data?.id
          )

          if (
            choice &&
            choice?.preview &&
            typeof choice?.preview === "function"
          ) {
            ;(choice as any).index = data?.index
            ;(choice as any).input = data?.input

            if (choice?.onFocus) {
              try {
                choice?.onFocus(choice)
              } catch (error) {
                throw new Error(error)
              }
            }

            try {
              return choice?.preview(choice)
            } catch {
              return `Failed to render preview`
            }
          }

          return ``
        }),
        debounceTime(0),
        withLatestFrom(onChoices$),
        share()
      )

      .subscribe(
        async ([preview, onChoiceData]: [
          string,
          AppMessage
        ]) => {
          if (onChoiceData.channel === Channel.CHOICES) {
            global.setPreview(preview)
          }
        }
      )

    initialChoices$
      .pipe(takeUntil(value$), share())
      .subscribe()

    value$.subscribe({
      next: value => {
        resolve(value)
      },
      complete: () => {
        global.log(`✅ Prompt #${promptId} Done`)
      },
      error: error => {
        reject(error)
      },
    })
  })
}

let onNoChoicesDefault = async (input: string) => {
  setPreview(`<div/>`)
}

let onChoicesDefault = async (input: string) => {}

global.setPrompt = (data: Partial<PromptData>) => {
  let { tabs } = data
  if (tabs) global.onTabs = tabs

  global.send(Channel.SET_PROMPT_DATA, {
    flags: prepFlags(data?.flags || {}),
    hint: "",
    ignoreBlur: false,
    input: "",
    kitScript: global.kitScript,
    kitArgs: global.args,
    mode: Mode.FILTER,
    placeholder: "",
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
    ...(data as PromptData),
  })
}

let prepPrompt = async (config: PromptConfig) => {
  let { choices, placeholder, preview, ...restConfig } =
    config

  global.setPrompt({
    strict: Boolean(choices),
    hasPreview: Boolean(preview),
    ...restConfig,
    tabIndex: global.onTabs?.findIndex(
      ({ name }) => global.arg?.tab
    ),
    mode:
      typeof choices === "function" && choices?.length > 0
        ? Mode.GENERATE
        : Mode.FILTER,
    placeholder: stripAnsi(placeholder || ""),

    preview:
      preview && typeof preview === "function"
        ? await preview()
        : (preview as string),
  })
}

let kitPrompt$ = new Subject()

global.kitPrompt = async (config: PromptConfig) => {
  kitPrompt$.next(true)
  await new Promise(r => setTimeout(r, 0)) //need to let tabs finish...
  let {
    choices = [],
    className = "",
    validate = null,
    onNoChoices = onNoChoicesDefault,
    onChoices = onChoicesDefault,
  } = config

  await prepPrompt(config)

  return await waitForPromptValue({
    choices,
    validate,
    className,
    onNoChoices,
    onChoices,
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
    ? ``
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

global.editor = async (
  options: EditorConfig & { hint?: string } = {
    value: "",
    language: "",
    scrollTo: "top",
  }
) => {
  send(
    Channel.SET_EDITOR_CONFIG,

    typeof options === "string"
      ? { value: options }
      : options
  )
  return await global.kitPrompt({
    ui: UI.editor,
    hint: options.hint,
    ignoreBlur: true,
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
  choices
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
    placeholder: `cmd + s to submit\ncmd + w to close`,
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

    let hint = `[${packageName}](${packageLink}) has had ${
      (
        await get<{ downloads: number }>(
          `https://api.npmjs.org/downloads/point/last-week/` +
            packageName
        )
      ).data.downloads
    } downloads from npm in the past week`

    let trust = await global.arg(
      { placeholder, hint: md(hint), ignoreBlur: true },
      [
        {
          name: `Abort`,
          value: "false",
        },
        {
          name: `Install ${packageName}`,
          value: "true",
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

global.setIgnoreBlur = async ignore => {
  global.send(Channel.SET_IGNORE_BLUR, ignore)
}

global.getDataFromApp = async (channel: GetAppData) => {
  if (process?.send) {
    return await new Promise((res, rej) => {
      let messageHandler = data => {
        if (data.channel === channel) {
          res(data)
          process.off("message", messageHandler)
        }
      }
      process.on("message", messageHandler)

      send(channel)
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

global.submit = (value: any) => {
  global.send(Channel.SET_SUBMIT_VALUE, value)
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
  if (process.env.KIT_CONTEXT === "app")
    await run(mainScriptPath)
}

delete process.env?.["ELECTRON_RUN_AS_NODE"]
delete global?.env?.["ELECTRON_RUN_AS_NODE"]
