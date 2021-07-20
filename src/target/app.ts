import { Observable, merge, NEVER, of, Subject } from "rxjs"
import {
  filter,
  map,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
} from "rxjs/operators"
import stripAnsi from "strip-ansi"

import { Mode, Channel, UI } from "kit-bridge/esm/enum"
import { Choice, EditorConfig } from "kit-bridge/esm/type"
import { assignPropsTo } from "kit-bridge/esm/util"

// let exception$ = new Observable(observer => {
//   let e = (error: Error) => observer.next(error)
//   process.on("uncaughtException", e)

//   return () => {
//     process.off("uncaughtException", e)
//   }
// }).pipe(share())

// let rejection$ = new Observable(observer => {
//   let e = (error: Error) => observer.next(error)

//   process.on("unhandledRejection", e)

//   return () => {
//     process.off("unhandledRejection", e)
//   }
// }).pipe(share())

interface MessageHandler {
  (data: AppMessage): void
}

interface ErrorHandler {
  (error: Error): void
}

interface AppMessage {
  channel: Channel
  value?: any
  input?: string
  tab?: string
}

let displayChoices = (choices: Choice<any>[]) => {
  switch (typeof choices) {
    case "string":
      global.setPanel(choices)
      break

    case "object":
      global.setChoices(choices)
      break
  }
}

interface ChoicesTarget {
  promptId: number
  tabIndex: number
}
let promptId = 0
let invokeChoices =
  ({ ct, choices }) =>
  async (input: string) => {
    let resultOrPromise = choices(input)

    if (resultOrPromise && resultOrPromise.then) {
      let result = await resultOrPromise

      if (
        ct.promptId === promptId &&
        ct.tabIndex === global.onTabIndex
      ) {
        displayChoices(result)
        return result
      }
    } else {
      displayChoices(resultOrPromise)
      return resultOrPromise
    }
  }

let getInitialChoices = async ({ ct, choices }) => {
  if (typeof choices === "function") {
    return await invokeChoices({ ct, choices })("")
  } else {
    displayChoices(choices as any)
    return choices
  }
}

let waitForPromptValue = ({ choices, validate, ui }) =>
  new Promise((resolve, reject) => {
    promptId++
    let ct = {
      promptId,
      tabIndex: global.onTabIndex,
    }

    let process$ = new Observable<AppMessage>(observer => {
      let m = (data: AppMessage) => observer.next(data)
      let e = (error: Error) => observer.error(error)
      process.on("message", m)
      process.on("error", e)
      return () => {
        process.off("message", m)
        process.off("error", e)
      }
    }).pipe(
      switchMap(data => of(data)),
      share()
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

    let message$ = process$.pipe(share(), takeUntil(tab$))

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
        return invokeChoices({ ct, choices })(input)
      }),
      switchMap(choice => NEVER)
    )

    let value$ = message$.pipe(
      filter(
        data => data.channel === Channel.VALUE_SUBMITTED
      ),
      map(data => data.value),
      switchMap(async value => {
        if (validate) {
          let validateMessage = await validate(value)

          if (typeof validateMessage === "string") {
            let Convert = await npm("ansi-to-html")
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

    let initialChoices$ = of({ ct, choices }).pipe(
      // filter(() => ui === UI.arg),
      switchMap(getInitialChoices)
    )

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
    choices = [],
    secret = false,
    hint = "",
    input = "",
    ignoreBlur = false,
    mode = Mode.FILTER,
  } = config

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
  })

  global.setHint(hint)
  if (input) global.setInput(input)
  if (ignoreBlur) global.setIgnoreBlur(true)

  return await waitForPromptValue({ choices, validate, ui })
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

      let Convert = await npm("ansi-to-html")
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
  // if (firstArg) {
  //   let valid = true
  //   if (
  //     typeof placeholderOrConfig !== "string" &&
  //     placeholderOrConfig?.validate
  //   ) {
  //     let { validate } = placeholderOrConfig
  //     let validOrMessage = await validate(firstArg)
  //     valid =
  //       typeof validOrMessage === "boolean" &&
  //       validOrMessage

  //     if (typeof validOrMessage === "string")
  //       placeholderOrValidateMessage = validOrMessage
  //   }

  //   if (valid) {
  //     return firstArg
  //   }
  // }

  if (typeof placeholderOrConfig === "string") {
    return await global.kitPrompt({
      ui: UI.arg,
      placeholder: placeholderOrConfig,
      choices,
    })
  }

  return await global.kitPrompt({
    choices,
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

let { default: minimist } = (await import(
  "minimist"
)) as any

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
      return [`--${key}`, value]
    })

  assignPropsTo(argv, global.arg)
}

global.updateArgs(process.argv.slice(2))

let appInstall = async packageName => {
  if (!global.arg?.trust) {
    let placeholder = `${packageName} is required for this script`

    let packageLink = `https://npmjs.com/package/${packageName}`

    let hint = `[${packageName}](${packageLink}) has had ${
      (
        await get(
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

global.getScriptsState = () =>
  global.getDataFromApp("SCRIPTS_STATE")
