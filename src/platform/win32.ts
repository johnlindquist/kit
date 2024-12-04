import { KIT_FIRST_PATH } from "../core/utils.js"

let notSupported = name => async () =>
  await div(
    md(`# ${name} is Not Supported on Windows

Have an idea on how to support it? Please share on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/ideas)

`)
  )
global.edit = async (p, dir, line, col) => {
  let e = async () => {
    if (env?.KIT_EDITOR) {
      let isPath = await isFile(env.KIT_EDITOR)
      return isPath ? `"${env.KIT_EDITOR}"` : env.KIT_EDITOR
    }

    if (env?.PATH?.toLowerCase().includes("code"))
      return "code"

    return ""
  }
  try {
    let command = `${await e()} "${p}"`
    if (typeof dir === "string") command += ` "${dir}"`
    await global.exec(command, {
      shell: true,
      env: {
        HOME: home(),
      },
    })
  } catch {}
}

let activeFileSearchProcess: ReturnType<typeof exec>
global.fileSearch = async (
  name,
  { onlyin, kind } = { onlyin: home(), kind: "" }
) => {
  const command = `where /r ${onlyin} *${name.replace(
    /\W/g,
    "*"
  )}*`

  let stdout = ""
  let stderr = ""
  try {
    if (activeFileSearchProcess) {
      try {
        activeFileSearchProcess?.kill()
      } catch {}
    }

    activeFileSearchProcess = global.exec(command)
    ;({ stdout, stderr } = (await activeFileSearchProcess) as { stdout: string; stderr: string })
    activeFileSearchProcess = null
    if (stderr) {
      console.log(stderr)
    }
  } catch (error) {
    stdout = `No results for ${name}`
  }

  return stdout.split("\r\n").filter(Boolean)
}

global.selectKitEditor = async () => {
  await div({
    html: md(`# Select Kit Editor

Create a \`KIT_EDITOR\` environment variable for the path of your editor

Example:
~~~bash
KIT_EDITOR="C:\\Users\\johnl\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
~~~

`),
    enter: "Open .env",
  })

  await edit(kenvPath(".env"))

  return "kit"
}

// comment out means they are supported in windows
global.applescript = notSupported("applescript")
global.copyPathAsImage = notSupported("copyPathAsImage")
// global.fileSearch = notSupported("fileSearch")
global.focusTab = notSupported("focusTab")
global.focusWindow = notSupported("focusWindow")
global.getActiveTab = notSupported("getActiveTab")
// global.getActiveScreen = notSupported("getActiveScreen")
global.getActiveAppInfo = notSupported("getActiveAppInfo")
global.getActiveAppBounds = notSupported(
  "getActiveAppBounds"
)
global.getActiveTab = notSupported("getActiveTab")
// global.getMousePosition = notSupported("getMousePosition")
// global.getScreens = notSupported("getScreens")
global.getSelectedFile = notSupported("getSelectedFile")
global.setSelectedFile = notSupported("setSelectedFile")
global.getSelectedDir = notSupported("getSelectedDir")
// global.revealInFinder = notSupported("revealInFinder")
// global.selectFile = notSupported("selectFile")
// global.selectFolder = notSupported("selectFolder")
// global.revealFile = notSupported("revealFile")
// global.getSelectedText = notSupported("getSelectedText")
// global.cutText = notSupported("cutText")
global.getTabs = notSupported("getTabs")
global.getWindows = notSupported("getWindows")
global.getWindowsBounds = notSupported("getWindowsBounds")
global.keystroke = notSupported("keystroke")
// global.openLog = notSupported("openLog")
global.organizeWindows = notSupported("organizeWindows")
// global.playAudioFile = notSupported("playAudioFile")
// global.say = notSupported("say")
// global.beep = notSupported("beep")
global.scatterWindows = notSupported("scatterWindows")
// global.scrapeAttribute = notSupported("scrapeAttribute")
// global.scrapeSelector = notSupported("scrapeSelector")
global.setActiveAppBounds = notSupported(
  "setActiveAppBounds"
)
global.setActiveAppPosition = notSupported(
  "setActiveAppPosition"
)
global.setActiveAppSize = notSupported("setActiveAppSize")
// global.setSelectedText = notSupported("setSelectedText")
global.setWindowBoundsByIndex = notSupported(
  "setWindowBoundsByIndex"
)
global.setWindowPosition = notSupported("setWindowPosition")
global.setWindowPositionByIndex = notSupported(
  "setWindowPositionByIndex"
)
global.setWindowSize = notSupported("setWindowSize")
global.setWindowSizeByIndex = notSupported(
  "setWindowSizeByIndex"
)
global.tileWindow = notSupported("tileWindow")
// global.term = notSupported("term")

global.mute = async () => {
  await exec(
    'powershell -c "(New-Object -ComObject shell.application).Windows().Item().Document.ExecCommand(&H80)"'
  )
}

global.unmute = async () => {
  await exec(
    'powershell -c "(New-Object -ComObject shell.application).Windows().Item().Document.ExecCommand(&H80)"'
  )
}

global.logout = async () => {
  await exec("shutdown /l")
}

global.lock = async () => {
  await exec("rundll32.exe user32.dll,LockWorkStation")
}

global.sleep = async () => {
  await exec(
    "rundll32.exe powrprof.dll,SetSuspendState 0,1,0"
  )
}

global.shutdown = async () => {
  await exec("shutdown /s /t 0")
}

global.quitAllApps = async (appsToExclude = "") => {
  const excludeApps = appsToExclude
    ? appsToExclude
        .split(",")
        .map(app => app.trim())
        .join(",")
    : ""

  const script = `
    $excludeApps = @(${excludeApps})
    Get-Process | Where-Object { $_.MainWindowTitle -ne "" -and $_.ProcessName -notin $excludeApps } | ForEach-Object { $_.CloseMainWindow() }
  `

  await exec(`powershell -Command "${script}"`)
}

global.adjustVolume = async () => {
  let volume = await arg({
    name: "Adjust Volume",
    description: "Enter a number between 0 and 100",
  })

  await exec(
    `powershell -c "$volume = [int]${volume}/100; $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]0xAF); Start-Sleep -Milliseconds 50; $obj.SendKeys([char]0xAE); Start-Sleep -Milliseconds 50; $obj.SendKeys([char]0xAF); $obj.SendKeys([string]([int]($volume * 50)))"`
  )
}

global.sleepScreens = async () => {
  await exec(
    'powershell -c "(Add-Type \'[DllImport(\\"user32.dll\\")]^public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);\' -Name a -Pas)::SendMessage(-1,0x0112,0xF170,2)"'
  )
}

global.caffeinate = async () => {
  run(kitPath("cli", "caffeinate.js"))
}
