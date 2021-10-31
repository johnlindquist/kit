import { Choice, PromptConfig } from "../types/core"

import { EditorConfig } from "../types/kitapp"

import {
  filter,
  map,
  merge,
  NEVER,
  Observable,
  of,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
} from "@johnlindquist/kit-internal/rxjs"
import { minimist } from "@johnlindquist/kit-internal/minimist"
import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"
import { Convert } from "@johnlindquist/kit-internal/ansi-to-html"

import { Mode, Channel, UI } from "../core/enum.js"
import { assignPropsTo } from "../core/utils.js"
import { Rectangle } from "../types/electron"

interface AppMessage {
  channel: Channel
  value?: any
  input?: string
  tab?: string
  flag?: string
  index?: number
  id?: string
}

let displayChoices = (
  choices: Choice<any>[],
  className = ""
) => {
  switch (typeof choices) {
    case "string":
      global.setPanel(choices, className)
      break

    case "object":
      global.setChoices(checkResultInfo(choices), className)
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
let invokeChoices =
  ({ ct, choices, className }) =>
  async (input: string) => {
    let resultOrPromise = choices(input)

    if (resultOrPromise && resultOrPromise.then) {
      let result = await resultOrPromise

      if (
        ct.promptId === promptId &&
        ct.tabIndex === global.onTabIndex
      ) {
        displayChoices(result, className)
        return result
      }
    } else {
      displayChoices(resultOrPromise, className)
      return resultOrPromise
    }
  }

let getInitialChoices = async ({
  ct,
  choices,
  className,
}) => {
  if (typeof choices === "function") {
    return await invokeChoices({ ct, choices, className })(
      ""
    )
  } else {
    displayChoices(choices as any, className)
    return choices
  }
}

let waitForPromptValue = ({
  choices,
  validate,
  ui,
  className,
}) =>
  new Promise((resolve, reject) => {
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
    }).pipe(
      share(),
      switchMap(data => of(data))
    )

    let tab$ = process$.pipe(
      filter(data => data.channel === Channel.TAB_CHANGED),
      tap(data => {
        let tabIndex = global.onTabs.findIndex(
          ({ name }) => {
            return name == data?.tab
          }
        )

        // console.log(`\nUPDATING TAB: ${tabIndex}`)
        global.onTabIndex = tabIndex
        global.currentOnTab = global.onTabs[tabIndex].fn(
          data?.input
        )
      }),
      share()
    )

    let message$ = process$.pipe(takeUntil(tab$))

    let generate$ = message$.pipe(
      filter(
        data => data.channel === Channel.GENERATE_CHOICES
      ),
      map(data => data.input),
      switchMap(input => {
        let ct = {
          promptId,
          tabIndex: +Number(global.onTabIndex),
        }
        return invokeChoices({ ct, choices, className })(
          input
        )
      }),
      switchMap(choice => NEVER)
    )

    let valueSubmitted$ = message$.pipe(
      filter(
        data => data.channel === Channel.VALUE_SUBMITTED
      )
    )

    let value$ = valueSubmitted$.pipe(
      tap(data => {
        if (data.flag) {
          global.flag[data.flag] = true
        }
      }),
      map(data => data.value),
      switchMap(async value => {
        if (validate) {
          let validateMessage = await validate(value)

          if (typeof validateMessage === "string") {
            let convert = new Convert()
            global.setHint(convert.toHtml(validateMessage))
            global.setChoices(global.kitPrevChoices)
          } else {
            return value
          }
        } else {
          return value
        }
      }),
      filter(value => typeof value !== "undefined"),
      take(1)
    )

    let blur$ = message$.pipe(
      filter(
        data => data.channel === Channel.PROMPT_BLURRED
      )
    )

    blur$.pipe(takeUntil(value$)).subscribe({
      next: () => {
        exit()
      },
    })

    generate$.pipe(takeUntil(value$)).subscribe()

    let initialChoices$ = of({
      ct,
      choices,
      className,
    }).pipe(
      // filter(() => ui === UI.arg),
      switchMap(getInitialChoices)
    )

    let choice$ = message$.pipe(
      filter(
        data => data.channel === Channel.CHOICE_FOCUSED
      ),
      switchMap(data => of(data))
    )

    choice$
      .pipe(takeUntil(value$))
      .subscribe(async data => {
        // console.log(`...${data?.index}`)
        let choice = (global.kitPrevChoices || []).find(
          (c: Choice) => c.id === data?.id
        )

        if (
          choice &&
          choice?.preview &&
          typeof choice?.preview === "function" &&
          choice?.preview[Symbol.toStringTag] ===
            "AsyncFunction"
        ) {
          let result = await choice?.preview(
            choice,
            data?.index
          )

          global.setPreview(result)
        }
      })

    initialChoices$.pipe(takeUntil(value$)).subscribe()

    merge(value$).subscribe({
      next: value => {
        resolve(value)
      },
      complete: () => {
        // console.log(`Complete: ${promptId}`)
      },
      error: error => {
        reject(error)
      },
    })
  })

global.kitPrompt = async (config: PromptConfig) => {
  await wait(0) //need to let tabs finish...
  let {
    ui = UI.arg,
    placeholder = "",
    validate = null,
    strict = Boolean(config?.choices),
    choices: choices = [],
    secret = false,
    hint = "",
    input = "",
    ignoreBlur = false,
    mode = Mode.FILTER,
    className = "",
    flags = undefined,
    selected = "",
    type = "text",
  } = config
  if (flags) {
    setFlags(flags)
  }

  global.setMode(
    typeof choices === "function" && choices?.length > 0
      ? Mode.GENERATE
      : mode
  )

  let tabs = global.onTabs?.length
    ? global.onTabs.map(({ name }) => name)
    : []

  global.send(Channel.SET_PROMPT_DATA, {
    tabs,
    tabIndex: global.onTabs?.findIndex(
      ({ name }) => global.arg?.tab
    ),
    placeholder: stripAnsi(placeholder),
    kitScript: global.kitScript,
    parentScript: global.env.KIT_PARENT_NAME,
    kitArgs: global.args.join(" "),
    secret,
    ui,
    strict,
    selected,
    type,
    ignoreBlur,
  })

  global.setHint(hint)
  if (input) global.setInput(input)
  if (ignoreBlur) global.setIgnoreBlur(true)

  return await waitForPromptValue({
    choices,
    validate,
    ui,
    className,
  })
}

global.drop = async (
  placeholder = "Waiting for drop..."
) => {
  return await global.kitPrompt({
    ui: UI.drop,
    placeholder,
    ignoreBlur: true,
  })
}

global.form = async (html = "", formData = {}) => {
  send(Channel.SET_FORM_HTML, { html, formData })
  return await global.kitPrompt({
    ui: UI.form,
  })
}

global.div = async (html = "", containerClasses = "") => {
  let wrapHtml = `<div class="${containerClasses}">${html}</div>`
  return await global.kitPrompt({
    choices: wrapHtml,
    ui: UI.div,
  })
}

global.editor = async (
  options: EditorConfig = {
    value: "",
    language: "",
    scrollTo: "top",
  }
) => {
  send(Channel.SET_EDITOR_CONFIG, {
    options:
      typeof options === "string"
        ? { value: options }
        : options,
  })
  return await global.kitPrompt({
    ui: UI.editor,
    ignoreBlur: true,
  })
}

global.hotkey = async (
  placeholder = "Press a key combo:"
) => {
  return await global.kitPrompt({
    ui: UI.hotkey,
    placeholder,
  })
}

global.arg = async (
  placeholderOrConfig = "Type a value:",
  choices
) => {
  let firstArg = global.args.length
    ? global.args.shift()
    : null

  if (firstArg) {
    let validate = (placeholderOrConfig as PromptConfig)
      ?.validate

    if (typeof validate === "function") {
      let valid = await validate(firstArg)

      if (valid === true) return firstArg

      let convert = new Convert()

      let hint =
        valid === false
          ? `${firstArg} is not a valid value`
          : convert.toHtml(valid)
      return global.arg({
        ...(placeholderOrConfig as PromptConfig),
        hint,
      })
    } else {
      return firstArg
    }
  }

  if (typeof placeholderOrConfig === "string") {
    return await global.kitPrompt({
      ui: UI.arg,
      placeholder: placeholderOrConfig,
      choices: choices,
    })
  }

  return await global.kitPrompt({
    choices: choices,
    ...placeholderOrConfig,
  })
}

global.textarea = async (
  options = {
    value: "",
    placeholder: `cmd + s to submit\ncmd + w to close`,
  }
) => {
  send(Channel.SET_TEXTAREA_CONFIG, {
    options:
      typeof options === "string"
        ? { value: options }
        : options,
  })
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
      { placeholder, hint: md(hint) },
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

  await global.cli("install", packageName)
}

let { createNpm } = await import("../api/npm.js")
global.npm = createNpm(appInstall)

global.setPanel = async (html, containerClasses = "") => {
  let wrapHtml = `<div class="${containerClasses}">${html}</div>`
  global.send(Channel.SET_PANEL, {
    html: wrapHtml,
  })
}

global.setPreview = async (html, containerClasses = "") => {
  let wrapHtml = `<div class="${containerClasses}">${html}</div>`
  // global.setBounds({ width: 720, height: 480 })
  global.send(Channel.SET_PREVIEW, {
    html: wrapHtml,
  })
}

global.setMode = async mode => {
  global.send(Channel.SET_MODE, {
    mode,
  })
}

global.setHint = async hint => {
  global.send(Channel.SET_HINT, {
    hint,
  })
}

global.setInput = async input => {
  global.send(Channel.SET_INPUT, {
    input,
  })
}

global.setIgnoreBlur = async ignore => {
  global.send(Channel.SET_IGNORE_BLUR, { ignore })
}

global.getDataFromApp = async channel => {
  if (process?.send) {
    return await new Promise((res, rej) => {
      let messageHandler = data => {
        if (data.channel === channel) {
          res(data)
          process.off("message", messageHandler)
        }
      }
      process.on("message", messageHandler)

      send(`GET_${channel}`)
    })
  } else {
    return {}
  }
}

global.getBackgroundTasks = () =>
  global.getDataFromApp("BACKGROUND")

global.getSchedule = () => global.getDataFromApp("SCHEDULE")
global.getBounds = async () => {
  let data = await global.getDataFromApp("BOUNDS")
  return data?.bounds
}

global.getCurrentScreen = async () => {
  let data = await global.getDataFromApp("CURRENT_SCREEN")
  return data?.screen
}

global.getScriptsState = () =>
  global.getDataFromApp("SCRIPTS_STATE")

global.setBounds = (bounds: Partial<Rectangle>) => {
  global.send(Channel.SET_BOUNDS, {
    bounds,
  })
}

delete process.env?.["ELECTRON_RUN_AS_NODE"]
delete env?.["ELECTRON_RUN_AS_NODE"]
