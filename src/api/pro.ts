import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Channel, UI } from "../core/enum.js"
import { KIT_LAST_PATH } from "../core/utils.js"
import {
  TerminalOptions as TerminalConfig,
  Widget,
  WidgetAPI,
  WidgetMessage,
} from "../types/pro.js"

let widget: Widget = async (html, options = {}) => {
  hide()

  let { widgetId } = await global.getDataFromApp(
    Channel.WIDGET_GET,
    { command: global.kitCommand, html, options }
  )

  type WidgetHandler = (message: WidgetMessage) => void

  let clickHandler: WidgetHandler = () => {}
  let inputHandler: WidgetHandler = () => {}
  let closeHandler: WidgetHandler = () => {
    process.exit()
  }
  let resizedHandler: WidgetHandler = () => {}
  let movedHandler: WidgetHandler = () => {}

  let api: WidgetAPI = {
    capturePage: async () => {
      return (
        await global.getDataFromApp(
          Channel.WIDGET_CAPTURE_PAGE,
          { widgetId }
        )
      )?.imagePath
    },
    // update: (html, options = {}) => {
    //   global.send(Channel.WIDGET_UPDATE, {
    //     widgetId,
    //     html,
    //     options,
    //   })
    // },
    setState: (state: any) => {
      global.send(Channel.WIDGET_SET_STATE, {
        widgetId,
        state,
      })
    },
    close: () => {
      global.send(Channel.WIDGET_END, { widgetId })
    },
    fit: () => {
      global.send(Channel.WIDGET_FIT, { widgetId })
    },
    setSize: (width, height) => {
      global.send(Channel.WIDGET_SET_SIZE, {
        widgetId,
        width,
        height,
      })
    },
    setPosition: (x, y) => {
      global.send(Channel.WIDGET_SET_POSITION, {
        widgetId,
        x,
        y,
      })
    },
    call: (method, ...args) => {
      global.send(Channel.WIDGET_CALL, {
        widgetId,
        method,
        args,
      })
    },
    onClick: (handler: WidgetHandler) => {
      clickHandler = handler
    },
    onInput: (handler: WidgetHandler) => {
      inputHandler = handler
    },
    onClose: (handler: WidgetHandler) => {
      closeHandler = handler
    },
    onResized: (handler: WidgetHandler) => {
      resizedHandler = handler
    },
    onMoved: (handler: WidgetHandler) => {
      movedHandler = handler
    },
  }

  let messageHandler = (data: WidgetMessage) => {
    if (
      data.channel == Channel.WIDGET_CLICK &&
      data.widgetId == widgetId
    ) {
      clickHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_INPUT &&
      data.widgetId == widgetId
    ) {
      inputHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_RESIZED &&
      data.widgetId == widgetId
    ) {
      resizedHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_MOVED &&
      data.widgetId == widgetId
    ) {
      movedHandler(data)
    }

    if (data.channel === Channel.WIDGET_END) {
      if (data.widgetId === widgetId) {
        process.off("message", messageHandler)
        closeHandler(data)
      }
    }
  }

  process.on("message", messageHandler)

  return api
}

let menu = async (
  label: string,
  scripts: string[] = []
) => {
  send(Channel.SET_TRAY, {
    label,
    scripts,
  })
}

let term = async (
  commandOrConfig: string | TerminalConfig = ""
) => {
  let command = ""
  let config: TerminalConfig = {}

  if (typeof commandOrConfig === "string") {
    command = commandOrConfig
  } else {
    command = commandOrConfig?.command || ""
    config = commandOrConfig
  }

  return await global.kitPrompt({
    input: command,
    ui: UI.term,
    enter: "",
    shortcuts: [
      {
        name: "Continue Script",
        key: `ctrl+c`,
        bar: "right",
      },
    ],
    env: {
      ...global.env,
      PATH: KIT_LAST_PATH,
    },
    ...config,
  })
}

let oldTerm = async (
  commandOrConfig: string | TerminalConfig = "",
  forkOptions = {}
) => {
  let command = ""
  let config: TerminalConfig = {}

  if (typeof commandOrConfig === "string") {
    command = commandOrConfig
  } else {
    command = commandOrConfig?.command || ""
    config = commandOrConfig
  }

  let child
  let p = await new Promise<string>((res, rej) => {
    let out = ``
    let end = () => {
      child?.removeAllListeners()
      child?.kill()

      res(stripAnsi(out).trim().replace(/%$/, ""))
    }
    child = fork(kitPath("run", "pty.js"), [command], {
      cwd: process.cwd(),
      env: process.env,
      ...forkOptions,
    })

    type PtyMessage = {
      socketURL: string
      port: number
      data: string
    }

    child.once("message", async (data: PtyMessage) => {
      let maybe = data.data
      if (maybe && !maybe.match(/^\s/)) out += maybe
      if (stripAnsi(maybe).endsWith(`\u0007`)) out = ``

      log(`🔌 Terminal socket: ${data.socketURL}`)

      send(Channel.TERMINAL, data.socketURL)

      await global.kitPrompt({
        input: command,
        ui: UI.term,
        ...config,
      })

      send(Channel.TERMINAL, ``)

      end()
    })

    child.on("error", err => {
      rej(err)
    })

    child.on("exit", end)
    child.on("close", end)
  })

  child?.removeAllListeners()
  child?.kill()

  return p
}

global.widget = widget
global.menu = menu
global.term = term
