// Name: Account/Sign In
// Description: View Account, Sponsor, or Join Discord
// Enter: View Account
// Pass: true

import { authenticate } from "../api/kit.js"
import { getUserJson, setUserJson } from "../core/db.js"
import { Channel } from "../core/enum.js"
import { escapeShortcut, cmd, proPane } from "../core/utils.js"
setChoices([])

let sponsorUrl = `https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205`
try {
	sponsorUrl = (
		await readFile(kitPath("data", "sponsor-url.txt"), "utf-8")
	).trim()
} catch (error) {
	warn(`Failed to read sponsor-url.txt`)
}
try {
	sponsorUrl = (
		await readFile(kitPath("data", "sponsor-url.txt"), "utf-8")
	).trim()
} catch (error) {
	warn(`Failed to read sponsor-url.txt`)
}
let userJson = await getUserJson()
let appState = await getAppState()
if (userJson.login) {
	let option = await arg(
		{
			placeholder: "Account Actions",
			shortcuts: [escapeShortcut],
			onNoChoices: async (input) => {
				if (input) {
					setPanel(
						md(`# Expected ${input} in the Account Tab?
  Share your idea 💡 [Request on GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/ideas)
    `)
					)
				}
			}
		},
		[
			...(appState?.isSponsor
				? []
				: [
						{
							name: "Unlock Script Kit Pro",
							preview: md(proPane()),
							value: "pro",
							enter: "Go Pro"
						},
						{
							name: "Check Pro Status",
							preview: md(`# Ping the Script Kit Pro Server
      
      This will check your Pro status and update your account if successful.
              `),
							value: "pro-status",
							enter: "Check Status"
						}
					]),
			{
				name: "Join Script Kit Discord",
				preview: md(`# Join Us on the Script Kit Discord

We're a friendly bunch, sharing scripts and discussing ideas in a relaxed atmosphere. 
If you ever run into any issues, we're here to help troubleshoot and learn together. 
Come join our awesome community and let's grow as scripters together!

[Join Discord Server](submit:discord)
                    `),
				value: "discord",
				enter: "Join Discord Server"
			},
			{
				name: "Sign Out",
				value: "logout",
				enter: "Logout",
				preview: md(`# Log Out of Your GitHub Account

This will remove your GitHub token from your local machine and Script Kit will no longer be able to access your GitHub account.

You can always log back in again later.
`)
			}
		]
	)
	switch (option) {
		case "pro":
			open(sponsorUrl)
			break
		case "discord":
			let response = await get(`https://scriptkit.com/api/discord-invite`)
			open(response.data)
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
			await setUserJson({})
			await replace({
				files: kenvPath(".env"),
				from: /GITHUB_SCRIPTKIT_TOKEN=.*/g,
				to: ``,
				disableGlobs: true
			})
			process.env.GITHUB_SCRIPTKIT_TOKEN = env.GITHUB_SCRIPTKIT_TOKEN = ``

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
<a href="submit:login" class="text-black border-2 border-primary/50 dark:border-none font-bold px-3 py-3 h-6 no-underline rounded bg-white bg-opacity-80  hover:opacity-75 shadow-sm shadow-primary/25">Sign in with GitHub</a>

<div class="py-1"></div>

<div>

## Standard Features

- Share Scripts
- Create Gists
- Discord Server Invite
</div>
`)
	let option = await div({
		height: PROMPT.HEIGHT["3XL"],
		enter: "Sign In",
		name: `Sign in with GitHub to unlock all features.`,
		description: "",
		html: `
      <div class="flex flex-col">
      ${topPane}
      <div class="flex flex-row">  
        <div class="px-4">${middlePane}</div>
        <div class="px-4 flex-1 border-l border-white dark:border-dark dark:border border-opacity-25 dark:border-opacity-25">${md(
					proPane()
				)}</div>
      </div>
      </div>`,
		shortcuts: [
			{
				name: "Go Pro",
				key: `${cmd}+o`,
				bar: "right",
				onPress: async (input, { focused }) => {
					open(sponsorUrl)
				}
			}
		]
	})
	switch (option) {
		case "pro":
			open(sponsorUrl)
			break
		default:
			await authenticate()
	}
	setTimeout(() => {
		focus()
	}, 500)
	await mainScript()
}
