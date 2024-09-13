// Name: Focus Window
// Description: List and Focus Open Application Windows
// Keyword: w
// Cache: true

import "@johnlindquist/kit"
import { escapeShortcut } from "../core/utils.js"
import type { Choice } from "../types/core.js"

let isMac = process.platform === "darwin"

if (isMac) {
	type MacWindows = {
		getWindows: (options: {
			showAllWindows: boolean
			onScreenOnly: boolean
		}) => Promise<
			{
				name: string
				ownerName: string
				number: number
				pid: number
			}[]
		>
	}
	let importKey = isMac ? "mac-windows" : ""
	let { getWindows } = (await import(importKey)) as MacWindows

	let apps = await db<{ choices: Choice[] }>(kitPath("db", "apps.json"))

	let windows = await getWindows({
		showAllWindows: true,
		onScreenOnly: false
	})

	let ignore = [
		"Notification Center",
		"Dock",
		"AvatarPickerMemojiPicker",
		"com.apple.preference.security.r"
	]

	let selectedWindow = await arg<{
		name: string
		ownerName: string
		number: number
		pid: number
	}>(
		{
			placeholder: "Focus Window",
			enter: "Focus",
			shortcuts: [escapeShortcut],
			resize: true,
			searchKeys: [
				"slicedName",
				"friendlyShortcut",
				"tag",
				"group",
				"command",
				"description"
			]
		},
		windows
			.filter((w) => !ignore.includes(w.ownerName) && w.name !== "")
			.map((w) => {
				let img =
					(apps?.choices?.length ? apps.choices : []).find(
						(a) => a.name === w.ownerName || a.name.includes(w.ownerName)
					)?.img || ""
				return {
					name: w.ownerName,
					description: w.name,
					img,
					value: w
				}
			})
	)
	await hide()
	await focusWindow(selectedWindow.ownerName, selectedWindow.name)
}
