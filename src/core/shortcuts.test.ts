import ava, { type ExecutionContext } from "ava"
import { friendlyShortcut, shortcutNormalizer } from "./utils"

function testShortcut(
	t: ExecutionContext,
	beforeFriendly: string,
	afterFriendlyMac: string,
	afterFriendlyWindows: string,
	skipNormalization = false
) {
	const friendlyResult = skipNormalization
		? friendlyShortcut(beforeFriendly)
		: friendlyShortcut(shortcutNormalizer(beforeFriendly))

	if (process.platform === "darwin") {
		t.is(friendlyResult, afterFriendlyMac)
		t.not(friendlyResult, afterFriendlyWindows)
	} else {
		t.is(friendlyResult, afterFriendlyWindows)
		t.not(friendlyResult, afterFriendlyMac)
	}
}

ava("no change", async (t) => {
	testShortcut(t, "cmd+e", "cmd+e", "ctrl+e")
})

ava("parse simple", async (t) => {
	testShortcut(t, "cmd e", "cmd+e", "ctrl+e")
})

ava("parse with spaces", async (t) => {
	testShortcut(t, "cmd shift e", "cmd+shift+e", "ctrl+shift+e")
})

ava("parse with +", async (t) => {
	testShortcut(t, "cmd+shift+e", "cmd+shift+e", "ctrl+shift+e")
})

ava("parse out of order", async (t) => {
	testShortcut(t, "shift cmd e", "cmd+shift+e", "ctrl+shift+e")
	testShortcut(t, "shift opt e", "opt+shift+e", "alt+shift+e")
})
ava("parse caps", async (t) => {
	testShortcut(t, "Shift Cmd E", "cmd+shift+e", "ctrl+shift+e")
	testShortcut(t, "Shift Command E", "cmd+shift+e", "ctrl+shift+e")
})

ava("parse alt", async (t) => {
	testShortcut(t, "alt cmd e", "cmd+opt+e", "ctrl+alt+e")
})

ava("friendlyShortcut requires normalization", async (t) => {
	const beforeFriendly = "cmd+shift+e"
	const afterFriendlyMac = "cmd+shift+e"
	const afterFriendlyWindows = "ctrl+shift+e"
	const friendlyResult = friendlyShortcut(beforeFriendly)
	// Friendly shortcuts require normalization prior to parsing
	if (process.platform === "darwin") {
		t.not(friendlyResult, afterFriendlyMac)
	} else {
		t.not(friendlyResult, afterFriendlyWindows)
	}
})
