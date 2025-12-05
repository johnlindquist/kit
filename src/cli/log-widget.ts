import "@johnlindquist/kit"
import { getLogFromScriptPath } from "../core/utils.js"

let scriptPath = await arg("Script Path")

let Convert = await npm("ansi-to-html")
let convert = new Convert()

let logWidget = await widget(
  `
<script>
let logEl = document.querySelector("#log")

let callback = ()=> {
    logEl.lastChild.scrollIntoView()
}
let observer = new MutationObserver(callback)

observer.observe(logEl, {childList: true})
</script>
<div class="font-mono text-xxs w-full h-full p-4">
    <div id="log" v-html="log" class="max-h-full overflow-y-scroll"/>
</div>
`,
  {
    width: 480,
    height: 320,
    alwaysOnTop: true,
    state: {
      log: `<p>Logging...</p>`,
    },
  }
)

let currentHtml = ``
let handleLog = line => {
  let lineHtml = convert.toHtml(line)
  currentHtml += `<p>${lineHtml}</p>`

  logWidget.setState({
    log: currentHtml,
  })
}

let logPath = getLogFromScriptPath(scriptPath)
await execLog("tail", ["-f", logPath], handleLog)
