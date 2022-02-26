import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Channel, UI } from "../core/enum.js"
import {
  Widget,
  WidgetAPI,
  WidgetMessage,
} from "../types/pro.js"

let widget: Widget = async (html, options = {}) => {
  hide()
  let filePath = kenvPath(
    ".widgets",
    `${global.kitCommand}.html`
  )

  let stylePath = path.resolve(
    env.KIT_APP_PATH,
    "dist",
    "style.css"
  )

  let petiteVuePath = kitPath(
    "node_modules",
    "petite-vue",
    "dist",
    "petite-vue.es.js"
  )

  await outputFile(
    filePath,
    `
    <script>
    let u = new URL(window.location.href)
    window.widgetId = u.searchParams.get("widgetId")
    </script>
    ${(options?.unpkg || [])
      ?.map(
        (lib: string) =>
          `<script src="https://unpkg.com/${lib}"></script>`
      )
      .join("\n")}      
    <link rel="stylesheet" href="${stylePath}">
    <style>
    body {
      ${
        options?.transparent
          ? `
        background-color: rgba(0, 0, 0, 0) !important;`
          : ``
      }

      ${
        options?.draggable
          ? `
          -webkit-user-select: none;
          -webkit-app-region: drag;
      `
          : ``
      }

      pointer-events: none
    }

    * {pointer-events: all;}
    .draggable {-webkit-app-region: drag;}
  </style>
    <script>
      const { ipcRenderer } = require('electron');
      window.ipcRenderer = ipcRenderer;
      window.onSetState = (state) => {}
    </script>

    <script type="module">
    import { createApp } from '${petiteVuePath}?module'
  
    function Widget() {
      return {
        $template: '#widget-template',
        state:{},
        setState(state) {
          for (let [key, value] of Object.entries(state)) {
            this[key] = value;
          }  
        },
        mounted() {
          ipcRenderer.on('WIDGET_SET_STATE', (event, state)=> {
            this.setState(state);
            onSetState(state);
          })
        }
      }
    }
  
    createApp({
      Widget
    }).mount()
  </script>
  
  <template id="widget-template">
    ${html}
  </template>
  
  <div id="__widget-container" v-scope="Widget()" @vue:mounted="mounted" class="flex justify-center items-center v-screen h-screen draggable"></div>

  <script>

    document.addEventListener("click", (event) => {
      ipcRenderer.send("WIDGET_CLICK", {
        targetId: event.target.id,
        widgetId: window.widgetId,
      })
    })


    document.addEventListener("input", (event) => {
      ipcRenderer.send("WIDGET_INPUT", {
        targetId: event.target.id,
        value: event.target.value,
        widgetId: window.widgetId,
      })
    })
    </script>

    <script>
    let fitWidget = () => {
      let firstChild = document.getElementById("__widget-container").firstElementChild;
      let display = firstChild.style.display
    
      firstChild.style.display = "inline-block"
    
      let data = {
        windowId: window.id,
        width: firstChild.offsetWidth,
        height: firstChild.offsetHeight,
        widgetId: window.widgetId,
      }
    
      ipcRenderer.send("WIDGET_MEASURE", data)
      firstChild.style.display = display
    }
    setTimeout(fitWidget, 2000)    

    ipcRenderer.on('WIDGET_FIT', (event, state)=> {
      fitWidget()
    })
    </script>
  `
  )

  let { widgetId } = await global.getDataFromApp(
    Channel.WIDGET_GET,
    { filePath, options }
  )

  type WidgetHandler = (message: WidgetMessage) => void

  let clickHandler: WidgetHandler = () => {}
  let inputHandler: WidgetHandler = () => {}
  let closeHandler: WidgetHandler = () => {}
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

  if (options?.state) {
    api.setState(options.state)
  }

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

let term = async (command: string = "") => {
  let child
  let p = await new Promise<string>((res, rej) => {
    let out = ``
    child = fork(kitPath("run", "pty.js"), [command])

    type PtyMessage = {
      socketURL: string
      port: number
      data: string
    }

    child.on("message", async (data: PtyMessage) => {
      let maybe = data.data
      if (maybe && !maybe.match(/^\s/)) out += maybe
      if (stripAnsi(maybe).endsWith(`\u0007`)) out = ``

      send(Channel.TERMINAL, data?.socketURL)

      await global.kitPrompt({
        input: command,
        ui: UI.term,
      })

      send(Channel.TERMINAL, ``)
      child?.kill()

      res(stripAnsi(out).trim().replace(/%$/, ""))
    })

    child.on("error", err => {
      rej(err)
    })

    child.on("exit", code => {
      res(stripAnsi(out).trim().replace(/%$/, ""))
    })
  })

  child?.kill()

  return p
}

global.widget = widget
global.menu = menu
global.term = term
