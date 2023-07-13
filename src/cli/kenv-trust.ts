// Name: Testing Extreme Caution

import { highlightJavaScript } from "../api/kit.js"
import {
  getKenvs,
  getTrustedKenvsKey,
} from "../core/utils.js"

let kenv = await arg(
  "Trust which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: path.basename(value),
    value: path.basename(value),
  }))
)

let scripts = await getScripts()
let kenvScripts = scripts.filter(s => s?.kenv === kenv)

let autoScripts = [
  ...kenvScripts.filter(s => s.shortcut),
  ...kenvScripts.filter(s => s.snippet),
  ...kenvScripts.filter(s => s.watch),
  ...kenvScripts.filter(s => s.background),
  ...kenvScripts.filter(s => s.schedule),
  ...kenvScripts.filter(s => s.system),
]

let hasAutoScripts = autoScripts.length > 0
let header = hasAutoScripts
  ? `## This Kenv contains scripts which run _AUTOMATICALLY_.`
  : `## This Kenv does not currently contain scripts which run automatically.`

let trustedKenvsKey = getTrustedKenvsKey()

let preview =
  md(`# <span class="text-red-500 text-3xl animate-pulse">Danger Zone<span>

${header}

Do you trust this kenv to run scripts automatically?

Scripts with the following features can run automatically:
- Shortcuts (registers global keyboard shortcuts)
- Snippets (listens for user text input)
- File Watchers (watches for file changes)
- Background Scripts (runs in the background)
- Scheduled Scripts (runs on a schedule)
- System Scripts (runs system events)

We have detected these features in the scripts below. Please review them carefully.

## Any Doubts? Ask for Help!

If you are unsure about the safety of these scripts, please ask the community for help before proceeding:

> [Get Help on GitHub](https://github.com/johnlindquist/kit/discussions/categories/q-a)
>
> [Get Help on Discord](https://discord.gg/qnUX4XqJQd)

## Accept Risks and Allow Scripts to Run Automatically
  
> To accept the risks and allow these scripts to run automatically, type "${kenv}" and hit "Enter".
  `)

let addPreview = async s => {
  s.preview = async () => {
    let preview = await readFile(s.filePath, "utf8")
    // if (preview.startsWith("/*") && preview.includes("*/")) {
    //   let index = preview.indexOf("*/")
    //   let content = preview.slice(2, index).trim()
    //   let markdown = md(content)
    //   let js = await highlightJavaScript(preview.slice(index + 2).trim())
    //   return markdown + js
    // }

    let detected = ``
    if (s.shortcut)
      detected += `* Shortcut: ${s.shortcut}\n`
    if (s.snippet) detected += `* Snippet: ${s.snippet}\n`
    if (s.watch) detected += `* Watch: ${s.watch}\n`
    if (s.background)
      detected += `* Background: ${s.background}\n`
    if (s.schedule)
      detected += `* Schedule: ${s.schedule}\n`
    if (s.system) detected += `* System: ${s.system}\n`

    if (detected) {
      detected = md(`# Detected Features\n\n${detected}`)
    }

    let js = await highlightJavaScript(
      preview,
      s?.shebang || ""
    )

    return `
  ${detected}        
  
  ${js}`
  }

  return s
}

let finalScripts = await Promise.all(
  autoScripts.map(addPreview)
)

let warningChoice = {
  name: "EXTREME CAUTION",
  description:
    "This kenv contains scripts which run automatically",
  preview,
}

let choices = [warningChoice, ...finalScripts]
setDescription(`Danger Zone`)
setName(`Danger Zone`)

setBounds({ height: PROMPT.HEIGHT["2XL"] })
setPauseResize(true)

let matchKenv = false
let matchKenvConfig = {
  enter: "",
  height: PROMPT.HEIGHT["4XL"],
  ignoreBlur: true,
  shortcuts: [],
  placeholder: `Type "${kenv}" to trust this kenv`,
  // onInit: async () => {
  //   setPauseResize(true)
  // },
  onInput: async input => {
    matchKenv = input === kenv
    if (matchKenv) {
      setPreview(`<div></div>`)
      setEnter(`Dangerously Trust ${kenv}`)
      setPanel(
        md(`# <span class="text-red-500 text-3xl animate-pulse">Danger Zone - Last Chance</span>
> <span class="text-primary">Caution</span>: These scripts may run as soon as you hit "enter"
>
> <span class="text-red-500">Extreme Caution</span>: Pulling updates from this kenv is _EXTREMELY RISKY_
          
## Hit "enter" to accept the risks

Hitting "enter" now will enable automatic features for the scripts in ${kenv} 

## How to Remove the Kenv

From the main menu: Kit tab -> Manage Kenvs -> Remove Kenv

## How to "Distrust" the Kenv
To "distrust" this kenv, you will need to remove it from the your ~/.kenv/.env:

~~~bash
${trustedKenvsKey}=${kenv}
~~~

        `)
      )
    } else {
      setPreview(preview)
      setEnter("")
    }
  },
}
let cliKenv = await arg(
  matchKenvConfig,
  async input => choices
)

let isCli = typeof cliKenv === "string"

if (matchKenv || (isCli && cliKenv === kenv)) {
  if (typeof process?.env?.[trustedKenvsKey] === "string") {
    let newValue = [
      ...process.env[trustedKenvsKey]
        .split(",")
        .filter(Boolean)
        .filter(k => k !== kenv),
      kenv,
    ].join(",")

    await global.cli(
      "set-env-var",
      trustedKenvsKey,
      newValue
    )
    if (!isCli) {
      await div({
        enter: "Back to Main Menu",
        html: md(`# "${kenv}" is now Trusted

Scripts located in the following directory are now trusted to run automatically:

~~~bash
${kenvPath("kenvs", kenv, "scripts")}
~~~

## How to Distrust "${kenv}"

Locate your .env, and remove the following line:

~~~bash
# Location of .env: ${kenvPath(".env")}
${trustedKenvsKey}=${newValue}
~~~`),
      })
    }
  } else {
    await appendFile(
      kenvPath(".env"),
      `\n${trustedKenvsKey}=${kenv}\n`
    )
  }
  if (!isCli) await mainScript()
} else {
  await div({
    html: md(`# Input didn't match "${kenv}". Exiting...`),
    onInit: async () => {
      await wait(2000)
      await mainScript()
    },
  })
}
