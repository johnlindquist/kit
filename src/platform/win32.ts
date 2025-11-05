import { getCleanEnvForExternalApp } from "./base.js"

// List of Windows editors including established ones plus newer options.
const WIN_EDITORS = [
  {
    name: 'Visual Studio Code',
    exe: 'code',
    paths: [
      '%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\Code.exe',
      '%ProgramFiles%\\Microsoft VS Code\\Code.exe',
      '%ProgramFiles(x86)%\\Microsoft VS Code\\Code.exe'
    ]
  },
  {
    name: 'Sublime Text',
    exe: 'subl',
    paths: ['%ProgramFiles%\\Sublime Text\\subl.exe', '%ProgramFiles(x86)%\\Sublime Text\\subl.exe']
  },
  {
    name: 'Notepad++',
    exe: 'notepad++',
    paths: ['%ProgramFiles%\\Notepad++\\notepad++.exe', '%ProgramFiles(x86)%\\Notepad++\\notepad++.exe']
  },
  {
    name: 'Atom',
    exe: 'atom',
    paths: ['%LOCALAPPDATA%\\atom\\atom.exe', '%ProgramFiles%\\Atom\\atom.exe', '%ProgramFiles(x86)%\\Atom\\atom.exe']
  },
  {
    name: 'Vim',
    exe: 'vim',
    paths: ['%ProgramFiles%\\Vim\\vim.exe', '%ProgramFiles(x86)%\\Vim\\vim.exe']
  },
  {
    name: 'Neovim',
    exe: 'nvim',
    paths: [
      '%LOCALAPPDATA%\\nvim-win64\\bin\\nvim.exe',
      '%ProgramFiles%\\Neovim\\bin\\nvim.exe',
      '%ProgramFiles(x86)%\\Neovim\\bin\\nvim.exe'
    ]
  },
  {
    name: 'Cursor', // New AI-powered editor (a fork of VS Code with AI features)
    exe: 'cursor',
    paths: [
      '%LOCALAPPDATA%\\Programs\\Cursor\\Cursor.exe',
      '%ProgramFiles%\\Cursor\\Cursor.exe',
      '%ProgramFiles(x86)%\\Cursor\\Cursor.exe'
    ]
  },
  {
    name: 'Windsurf', // An emerging AI-first IDE focused on performance/flow
    exe: 'windsurf',
    paths: [
      '%LOCALAPPDATA%\\Programs\\Windsurf\\Windsurf.exe',
      '%ProgramFiles%\\Windsurf\\Windsurf.exe',
      '%ProgramFiles(x86)%\\Windsurf\\Windsurf.exe'
    ]
  },
  {
    name: 'WebStorm', // JetBrains IDE for JavaScript/TypeScript
    exe: 'webstorm',
    paths: [
      '%LOCALAPPDATA%\\Programs\\JetBrains\\WebStorm\\bin\\webstorm64.exe',
      '%ProgramFiles%\\JetBrains\\WebStorm\\bin\\webstorm64.exe',
      '%ProgramFiles(x86)%\\JetBrains\\WebStorm\\bin\\webstorm64.exe'
    ]
  },
  {
    name: 'PhpStorm', // JetBrains IDE (includes WebStorm features plus PHP support)
    exe: 'phpstorm',
    paths: [
      '%LOCALAPPDATA%\\Programs\\JetBrains\\PhpStorm\\bin\\phpstorm64.exe',
      '%ProgramFiles%\\JetBrains\\PhpStorm\\bin\\phpstorm64.exe',
      '%ProgramFiles(x86)%\\JetBrains\\PhpStorm\\bin\\phpstorm64.exe'
    ]
  }
]

// Detect installed editors by first checking for their CLI command (via "where")
// and, if not found, by checking common installation paths.
const detectEditors = async () => {
  const installedEditors = []

  for (const editor of WIN_EDITORS) {
    try {
      // Check if editor is available via the system PATH.
      const { stdout } = await global.exec(`where ${editor.exe}`, {
        shell: true,
        windowsHide: true
      })

      if (stdout) {
        installedEditors.push({
          name: editor.name,
          value: editor.exe,
          description: stdout.split('\n')[0].trim()
        })
        continue
      }
    } catch (e) {
      // Ignore errors from "where" command.
    }

    // Check known installation paths if not found in PATH.
    for (const path of editor.paths) {
      const expandedPath = path.replace(/%([^%]+)%/g, (_, n) => process.env[n])
      try {
        if (await isFile(expandedPath)) {
          installedEditors.push({
            name: editor.name,
            value: `"${expandedPath}"`,
            description: expandedPath
          })
          break
        }
      } catch (e) {
        // Ignore file check errors.
      }
    }
  }

  return installedEditors
}

// Command generators for supported editors to open files at a specific line/column.
const editorCommands = {
  code: async (file, dir, line = 0, col = 0) => {
    const args = ['--goto', `"${file}:${line}:${col}"`]
    if (dir) args.push('--folder-uri', `"file:///${dir}"`)
    return `code ${args.join(' ')}`
  },

  'notepad++': async (file) => `notepad++ "${file}"`,

  subl: async (file, dir, line = 0, col = 0) => {
    const path = line ? `${file}:${line}:${col}` : file
    return `subl "${path}"${dir ? ` "${dir}"` : ''}`
  },

  vim: async (file) => `vim "${file}"`,
  nvim: async (file) => `nvim "${file}"`,

  cursor: async (file, dir, line = 0, col = 0) => {
    const args = ['--goto', `"${file}:${line}:${col}"`]
    if (dir) args.push('--folder-uri', `"file:///${dir}"`)
    return `cursor ${args.join(' ')}`
  },

  windsurf: async (file, dir, line = 0, col = 0) => {
    const args = ['--goto', `"${file}:${line}:${col}"`]
    if (dir) args.push('--folder-uri', `"file:///${dir}"`)
    return `windsurf ${args.join(' ')}`
  },

  webstorm: async (file, dir, line = 0, col = 0) => {
    const args = []
    if (line) args.push(`--line ${line}`)
    args.push(`"${file}"`)
    return `webstorm ${args.join(' ')}`
  },

  phpstorm: async (file, dir, line = 0, col = 0) => {
    const args = []
    if (line) args.push(`--line ${line}`)
    args.push(`"${file}"`)
    return `phpstorm ${args.join(' ')}`
  }
}

// ─── ORIGINAL FUNCTIONALITY (UNCHANGED) ───────────────────────────────────

// Utility for features not supported on Windows.
let notSupported = (name) => async () =>
  await div(
    md(`# ${name} is Not Supported on Windows

Have an idea on how to support it? Please share on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/ideas)
`)
  )

// global.edit: Updated to use our command generators when available,
// but falling back to the original behavior if not.
global.edit = async (p, dir, line, col) => {
  let e = async () => {
    if (env?.KIT_EDITOR) {
      let isPath = await isFile(env.KIT_EDITOR)
      if(isPath){
        return `"${env.KIT_EDITOR}"`
      }
      const editors = await detectEditors();

      let foundEditor = editors.find(e => e.name.toLowerCase() === env.KIT_EDITOR.toLowerCase());
      if (foundEditor) {
        return foundEditor.value
      }
      return env.KIT_EDITOR
    }

    if (env?.PATH?.toLowerCase().includes('code')) return 'code'

    return ''
  }
  try {
    const editor = await e()
    // Remove quotes, extract the executable name, and strip any ".exe"
    const editorName = editor.replace(/^"|"$/g, '').split('\\').pop().replace('.exe', '')

    let command
    if (editorCommands[editorName]) {
      command = await editorCommands[editorName](p, dir, line, col)
    } else {
      command = `${editor} "${p}"`
      if (typeof dir === 'string') command += ` "${dir}"`
    }

    command = command.replace(/\\/g, '/')

    await global.exec(command, {
      shell: true,
      env: getCleanEnvForExternalApp()
    })
  } catch {}
}

let activeFileSearchProcess /*: ReturnType<typeof exec>*/
global.fileSearch = async (name, { onlyin, kind } = { onlyin: home(), kind: '' }) => {
  const command = `where /r ${onlyin} *${name.replace(/\W/g, '*')}*`

  let stdout = ''
  let stderr = ''
  try {
    if (activeFileSearchProcess) {
      try {
        activeFileSearchProcess?.kill()
      } catch {}
    }

    activeFileSearchProcess = global.exec(command)
    ;({ stdout, stderr } = await activeFileSearchProcess) /* as { stdout: string; stderr: string }*/
    activeFileSearchProcess = null
    if (stderr) {
      console.log(stderr)
    }
  } catch (error) {
    stdout = `No results for ${name}`
  }

  return stdout.split('\r\n').filter(Boolean)
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
    enter: 'Open .env'
  })

  await edit(kenvPath('.env'))

  return 'kit'
}

// comment out means they are supported in windows
global.applescript = notSupported('applescript')
global.copyPathAsImage = notSupported('copyPathAsImage')
// global.fileSearch = notSupported("fileSearch")
global.focusTab = notSupported('focusTab')
global.focusWindow = notSupported('focusWindow')
global.getActiveTab = notSupported('getActiveTab')
// global.getActiveScreen = notSupported("getActiveScreen")
global.getActiveAppInfo = notSupported('getActiveAppInfo')
global.getActiveAppBounds = notSupported('getActiveAppBounds')
global.getActiveTab = notSupported('getActiveTab')
// global.getMousePosition = notSupported("getMousePosition")
// global.getScreens = notSupported("getScreens")
global.getSelectedFile = notSupported('getSelectedFile')
global.setSelectedFile = notSupported('setSelectedFile')
global.getSelectedDir = notSupported('getSelectedDir')
// global.revealInFinder = notSupported("revealInFinder")
// global.selectFile = notSupported("selectFile")
// global.selectFolder = notSupported("selectFolder")
// global.revealFile = notSupported("revealFile")
// global.getSelectedText = notSupported("getSelectedText")
// global.cutText = notSupported("cutText")
global.getTabs = notSupported('getTabs')
global.getWindows = notSupported('getWindows')
global.getWindowsBounds = notSupported('getWindowsBounds')
global.keystroke = notSupported('keystroke')
// global.openLog = notSupported("openLog")
global.organizeWindows = notSupported('organizeWindows')
// global.playAudioFile = notSupported("playAudioFile")
// global.say = notSupported("say")
// global.beep = notSupported("beep")
global.scatterWindows = notSupported('scatterWindows')
// global.scrapeAttribute = notSupported("scrapeAttribute")
// global.scrapeSelector = notSupported("scrapeSelector")
global.setActiveAppBounds = notSupported('setActiveAppBounds')
global.setActiveAppPosition = notSupported('setActiveAppPosition')
global.setActiveAppSize = notSupported('setActiveAppSize')
// global.setSelectedText = notSupported("setSelectedText")
global.setWindowBoundsByIndex = notSupported('setWindowBoundsByIndex')
global.setWindowPosition = notSupported('setWindowPosition')
global.setWindowPositionByIndex = notSupported('setWindowPositionByIndex')
global.setWindowSize = notSupported('setWindowSize')
global.setWindowSizeByIndex = notSupported('setWindowSizeByIndex')
global.tileWindow = notSupported('tileWindow')
// global.term = notSupported("term")

global.mute = async () => {
  await exec('powershell -c "(New-Object -ComObject shell.application).Windows().Item().Document.ExecCommand(&H80)"')
}

global.unmute = async () => {
  await exec('powershell -c "(New-Object -ComObject shell.application).Windows().Item().Document.ExecCommand(&H80)"')
}

global.logout = async () => {
  await exec('shutdown /l')
}

global.lock = async () => {
  await exec('rundll32.exe user32.dll,LockWorkStation')
}

global.sleep = async () => {
  await exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
}

global.shutdown = async () => {
  await exec('shutdown /s /t 0')
}

global.quitAllApps = async (appsToExclude = '') => {
  const excludeApps = appsToExclude
    ? appsToExclude
        .split(',')
        .map((app) => app.trim())
        .join(',')
    : ''

  const script = `
    $excludeApps = @(${excludeApps})
    Get-Process | Where-Object { $_.MainWindowTitle -ne "" -and $_.ProcessName -notin $excludeApps } | ForEach-Object { $_.CloseMainWindow() }
  `

  await exec(`powershell -Command "${script}"`)
}

global.adjustVolume = async () => {
  let volume = await arg({
    name: 'Adjust Volume',
    description: 'Enter a number between 0 and 100'
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
  run(kitPath('cli', 'caffeinate.js'))
}

export {}
