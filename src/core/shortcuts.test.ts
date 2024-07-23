import ava from "ava"
import { friendlyShortcut, shortcutNormalizer } from "./utils"

ava("no change", async (t) => {
	const beforeFriendly = "cmd+e"
	const afterFriendly = "cmd+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))
	t.is(friendlyResult, afterFriendly)
})

ava("parse simple", async (t) => {
	const beforeFriendly = "cmd e"
	const afterFriendly = "cmd+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))
	t.is(friendlyResult, afterFriendly)
})

ava("parse with spaces", async (t) => {
	const beforeFriendly = "cmd shift e"
	const afterFriendly = "cmd+shift+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))
	t.is(friendlyResult, afterFriendly)
})

ava("parse with +", async (t) => {
	const beforeFriendly = "cmd+shift+e"
	const afterFriendly = "cmd+shift+e"
	const friendlyResult = friendlyShortcut(shortcutNormalizer(beforeFriendly))
	t.is(friendlyResult, afterFriendly)
})

ava("friendlyShortcut requires normalization", async (t) => {
	const beforeFriendly = "cmd+shift+e"
	const afterFriendly = "cmd+shift+e"
	const friendlyResult = friendlyShortcut(beforeFriendly)
	// Friendly shortcuts require normalization prior to parsing
	t.not(friendlyResult, afterFriendly)
})
