import ava from "ava"
import { friendlyShortcut, shortcutNormalizer } from "./utils"

ava("no change", async (t) => {
	const beforeFriendly = "cmd+e"
	const afterFriendlyMac = "cmd+e"
	const afterFriendlyWindows = "ctrl+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("parse simple", async (t) => {
	const beforeFriendly = "cmd e"
	const afterFriendlyMac = "cmd+e"
	const afterFriendlyWindows = "ctrl+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("parse with spaces", async (t) => {
	const beforeFriendly = "cmd shift e"
	const afterFriendlyMac = "cmd+shift+e"
	const afterFriendlyWindows = "ctrl+shift+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("parse with +", async (t) => {
	const beforeFriendly = "cmd+shift+e"
	const afterFriendlyMac = "cmd+shift+e"
	const afterFriendlyWindows = "ctrl+shift+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("parse out of order", async (t) => {
	const beforeFriendly = "shift cmd e"
	const afterFriendlyMac = "cmd+shift+e"
	const afterFriendlyWindows = "ctrl+shift+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("parse alt", async (t) => {
	const beforeFriendly = "alt cmd e"
	const afterFriendlyMac = "cmd+opt+e"
	const afterFriendlyWindows = "ctrl+alt+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "win32") {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	}
})

ava("friendlyShortcut requires normalization", async (t) => {
	const beforeFriendly = "cmd+shift+e"
	const afterFriendlyMac = "cmd+shift+e"
	const afterFriendlyWindows = "ctrl+shift+e"
	const friendlyResult = friendlyShortcut(beforeFriendly)
	// Friendly shortcuts require normalization prior to parsing
	if (process.platform === "win32") {
		t.not(friendlyResult, afterFriendlyWindows)
	} else {
		t.not(friendlyResult, afterFriendlyMac)
	}
})
