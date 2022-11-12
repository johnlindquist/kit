// Name: Login to GitHub
// Description: Authenticate to Enable Features
import { authenticate } from "../api/kit.js"
import { getUserDb } from "../core/db.js"
import {
  backToMainShortcut,
  cmd,
  userDbPath,
} from "../core/utils.js"
setChoices([])

let proPane = md(`
## ⭐️ [Pro Account Features](submit:pro)

- Custom Themes
- Debugger
- Script Log Window
- Support through Discord

## Upcoming Pro Features

- Sync Scripts to GitHub Repo
- Run Script Remotely as GitHub Actions
- Advanced Widgets
- Screenshots
- Screen Recording
- Audio Recording
- Webcam Capture
- Desktop Color Picker
- Measure Tool`)

let sponsorUrl = `https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205`
try {
  sponsorUrl = (
    await readFile(
      kitPath("data", "sponsor-url.txt"),
      "utf-8"
    )
  ).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}

try {
  sponsorUrl = (
    await readFile(
      kitPath("data", "sponsor-url.txt"),
      "utf-8"
    )
  ).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}

let userDb = await getUserDb()
if (userDb.login) {
  let option = await arg(
    {
      placeholder: "Account",
      shortcuts: [backToMainShortcut],
    },
    [
      {
        name: "Unlock Script Kit Pro",
        preview: proPane,
        value: "pro",
        enter: "Go Pro",
      },
      {
        name: "Logout",
        value: "logout",
        enter: "Logout",
      },
    ]
  )

  switch (option) {
    case "pro":
      open(sponsorUrl)
      break
    case "logout":
      await rm(userDbPath)
      await replace({
        files: kenvPath(".env"),
        from: /GITHUB_SCRIPTKIT_TOKEN=.*/g,
        to: ``,
        disableGlobs: true,
      })
      process.env.GITHUB_SCRIPTKIT_TOKEN =
        env.GITHUB_SCRIPTKIT_TOKEN = ``
      await mainScript()
      break
  }
} else {
  let topPane = md(
    `# Unlock the Full Power of Script Kit!`,
    "px-5 pt-5 prose dark:prose-dark prose-sm"
  )

  let leftPane = md(`
## No Account

- All standard Kit features are free. No account required.

  `)

  let middlePane = md(`
## [Free Account](submit:free)

- Create Gists
- Discord Server Invite
`)

  let option = await arg(
    {
      placeholder: "Account",
      enter: "Sign In",
      shortcuts: [
        {
          name: `Scroll Up`,
          key: `up`,
          bar: "right",
          onPress: async (input, { focused }) => {},
        },
        {
          name: `Scroll Down`,
          key: `down`,
          bar: "right",
          onPress: async (input, { focused }) => {},
        },
        {
          name: "Go Pro",
          key: `${cmd}+o`,
          bar: "right",
          onPress: async (input, { focused }) => {
            open(sponsorUrl)
          },
        },
      ],
    },
    `
<div class="flex flex-col">
${topPane}
<div class="flex flex-row -mt-5">
  <div class="flex-1 border-r border-white dark:border-dark dark:border border-opacity-25 dark:border-opacity-25">${leftPane}</div>
  <div class="flex-1">${middlePane}</div>
  <div class="flex-1 border-l border-white dark:border-dark dark:border border-opacity-25 dark:border-opacity-25">${proPane}</div>
</div>
</div>`
  )

  switch (option) {
    case "pro":
      open(sponsorUrl)
      break
    default:
      await authenticate()
  }

  await mainScript()
}
