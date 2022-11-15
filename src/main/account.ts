// Name: Login to GitHub
// Description: Authenticate to Enable Features
// Exclude: true
import { authenticate } from "../api/kit.js"
import { getUserDb } from "../core/db.js"
import { Channel } from "../core/enum.js"
import {
  backToMainShortcut,
  cmd,
  userDbPath,
} from "../core/utils.js"
setChoices([])
let proPane = md(`

<h2 class="pb-1 text-xl">⭐️ Pro Account</h2>
<a href="submit:pro" class="shadow-xl shadow-primary-dark/25 dark:shadow-primary-light/25 text-white dark:text-black font-bold px-3 py-3 h-6 no-underline rounded bg-primary-dark dark:bg-primary-light bg-opacity-90 dark:bg-opacity-100 hover:opacity-80 dark:hover:opacity-80">Unlock All Features ($7/m.)</a>

<div class="py-1"></div>
<div class="flex">

<div class="list-inside">

## Pro Features

- Custom Themes
- Debugger
- Script Log Window
- Support through Discord

</div>

<div>

## Upcoming Pro Features

- Sync Scripts to GitHub Repo
- Run Script Remotely as GitHub Actions
- Advanced Widgets
- Screenshots
- Screen Recording
- Audio Recording
- Webcam Capture
- Desktop Color Picker
- Measure Tool

</div>
</div>
`)
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
        name: "Check Pro Status",
        preview: md(`# Ping the Script Kit Pro Server

This will check your Pro status and update your account if successful.
        `),
        value: "pro-status",
        enter: "Check Status",
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
    case "pro-status":
      let isSponsor = await sendWait(Channel.PRO_STATUS)
      if (isSponsor) {
        await div(md(`# You are a Sponsor! Thank you!`))
      } else {
        await div(
          md(`# You are not currently a Sponsor...
        
Please go to [${sponsorUrl}](${sponsorUrl}) to become a sponsor to unlock all features.
        `)
        )
      }

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
<h2 class="text-xl">No Account</h2>

- All standard Kit features are free. No account required.

  `)
  let middlePane = md(`
<h2 class="text-xl pb-1">Sign in with GitHub</h2>
<a href="submit:login" class="shadow-xl text-white dark:text-black font-bold px-3 py-3 h-6 no-underline rounded bg-black dark:bg-white bg-opacity-80 dark:bg-opacity-80 hover:opacity-75 dark:hover:opacity-75">Sign in with GitHub</a>

<div class="py-1"></div>

<div>

## Standard Features

- Create Gists
- Discord Server Invite
</div>
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
  <div class="px-4">${middlePane}</div>
  <div class="px-4 flex-1 border-l border-white dark:border-dark dark:border border-opacity-25 dark:border-opacity-25">${proPane}</div>
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
