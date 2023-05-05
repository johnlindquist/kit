import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"
import { Channel, UI } from "../core/enum.js"
import { KIT_FIRST_PATH } from "../core/utils.js"
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
    {
      command: global.kitCommand,
      html,
      options: {
        containerClass:
          "overflow-auto flex justify-center items-center v-screen h-screen",
        draggable: true,
        ...options,
      },
    }
  )

  type WidgetHandler = (message: WidgetMessage) => void

  let customHandler: WidgetHandler = () => {}
  let clickHandler: WidgetHandler = () => {}
  let dropHandler: WidgetHandler = () => {}
  let mouseDownHandler: WidgetHandler = () => {}
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
    onCustom: (handler: WidgetHandler) => {
      customHandler = handler
    },
    onClick: (handler: WidgetHandler) => {
      clickHandler = handler
    },
    onDrop: (handler: WidgetHandler) => {
      dropHandler = handler
    },
    onMouseDown: (handler: WidgetHandler) => {
      mouseDownHandler = handler
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
      data.channel == Channel.WIDGET_CUSTOM &&
      data.widgetId == widgetId
    ) {
      customHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_CLICK &&
      data.widgetId == widgetId
    ) {
      clickHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_DROP &&
      data.widgetId == widgetId
    ) {
      dropHandler(data)
    }

    if (
      data.channel == Channel.WIDGET_MOUSE_DOWN &&
      data.widgetId == widgetId
    ) {
      mouseDownHandler(data)
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

global.term = async (
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

  if (global.currentUI === UI.term) {
    // Hack to clear the terminal when it's already open
    await div({
      html: ``,
      height: PROMPT.HEIGHT.BASE,
      onInit: async () => {
        await wait(100)
        submit("")
      },
    })
  }

  return await global.kitPrompt({
    input: command,
    ui: UI.term,
    enter: "",
    ignoreBlur: true,
    shortcuts: [
      {
        name: "Exit",
        key: `${cmd}+w`,
        bar: "right",
        onPress: () => {
          exit()
        },
      },
      {
        name: "Continue",
        key: `${cmd}+enter`,
        bar: "right",
        onPress: () => {
          send(Channel.TERM_EXIT, "")
        },
      },
    ],
    env: {
      ...global.env,
      PATH: KIT_FIRST_PATH,
    },
    height: PROMPT.HEIGHT.BASE,
    ...config,
  })
}

global.term.write = async (text: string) => {
  await sendWait(Channel.TERM_WRITE, text)
}

global.widget = widget
global.menu = menu

global.showLogWindow = async (scriptPath = "") => {
  await sendWait(Channel.SHOW_LOG_WINDOW, scriptPath)
}

global.app = async (options = {}) => {
  return sendWait(Channel.APP, options)
}
