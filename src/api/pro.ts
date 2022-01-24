import { Channel } from "../core/enum.js"
import {
  Widget,
  WidgetAPI,
  WidgetMessage,
} from "../types/pro.js"

let widget: Widget = async (html, options = {}) => {
  let { widgetId } = await global.getDataFromApp(
    Channel.GET_WIDGET,
    { html, options }
  )

  let messageHandler = (data: WidgetMessage) => {
    if (
      data.channel == Channel.WIDGET_CLICK &&
      data.widgetId == widgetId
    ) {
      if (typeof options?.onClick === "function") {
        options.onClick(data)
      }
    }

    if (
      data.channel == Channel.WIDGET_INPUT &&
      data.widgetId == widgetId
    ) {
      if (typeof options?.onInput === "function") {
        options.onInput(data)
      }
    }
    if (data.channel === Channel.END_WIDGET) {
      if (data.widgetId === widgetId) {
        process.off("message", messageHandler)
        if (typeof options?.onClose === "function") {
          options.onClose()
        }
      }
    }
  }
  process.on("message", messageHandler)

  let api: WidgetAPI = {
    capturePage: async () => {
      return (
        await global.getDataFromApp(
          Channel.WIDGET_CAPTURE_PAGE,
          { widgetId }
        )
      )?.imagePath
    },
    update: (html, options = {}) => {
      global.send(Channel.UPDATE_WIDGET, {
        widgetId,
        html,
        options,
      })
    },
    close: () => {
      global.send(Channel.END_WIDGET, { widgetId })
    },
    fit: () => {
      global.send(Channel.FIT_WIDGET, { widgetId })
    },
    setSize: (width, height) => {
      global.send(Channel.SET_SIZE_WIDGET, {
        widgetId,
        width,
        height,
      })
    },
    setPosition: (x, y) => {
      global.send(Channel.SET_POSITION_WIDGET, {
        widgetId,
        x,
        y,
      })
    },
  }

  return api
}

let menubar = async (text: string) => {
  send(Channel.SET_TRAY, text)
}

global.pro = {
  beta: {
    widget,
    menubar,
  },
}
