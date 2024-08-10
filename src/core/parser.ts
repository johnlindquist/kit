import untildify from "untildify"
import type { Script, ScriptMetadata, ScriptPathInfo } from "../types"
import {
	getMetadata,
	isFile,
	kenvPath,
	kenvFromFilePath,
	shortcutNormalizer,
	friendlyShortcut
} from "./utils.js"
import { ProcessType } from "./enum.js"

export let postprocessMetadata = (
	metadata: Metadata,
	fileContents: string
): ScriptMetadata => {
	const result: Partial<ScriptMetadata> = { ...metadata }

	if (metadata.shortcut) {
		result.shortcut = shortcutNormalizer(metadata.shortcut)
		result.friendlyShortcut = friendlyShortcut(result.shortcut)
	}

	if (metadata.shortcode) {
		result.shortcode = metadata.shortcode?.trim()?.toLowerCase()
	}

	if (metadata.trigger) {
		result.trigger = metadata.trigger?.trim()?.toLowerCase()
	}

	// An alias brings the script to the top of the list
	if (metadata.alias) {
		result.alias = metadata.alias?.trim().toLowerCase()
	}

	if (metadata.image) {
		result.img = untildify(metadata.image)
	}

	result.type = metadata.schedule
		? ProcessType.Schedule
		: result?.watch
			? ProcessType.Watch
			: result?.system
				? ProcessType.System
				: result?.background
					? ProcessType.Background
					: ProcessType.Prompt

	let tabs =
		fileContents.match(new RegExp(`(?<=^onTab[(]['"]).+?(?=['"])`, "gim")) || []

	if (tabs?.length) {
		result.tabs = tabs
	}

	let hasPreview = Boolean(fileContents.match(/preview(:|\s{0,1}=)/gi)?.[0])
	if (hasPreview) {
		result.hasPreview = true
	}

	return result as unknown as ScriptMetadata
}

export let parseMetadata = (fileContents: string): ScriptMetadata => {
	let metadata: Metadata = getMetadata(fileContents)

	let processedMetadata = postprocessMetadata(metadata, fileContents)

	return processedMetadata
}

const shebangRegex = /^#!(.+)/m
export let getShebangFromContents = (contents: string): string | undefined => {
	let match = contents.match(shebangRegex)
	return match ? match[1].trim() : undefined
}

export let commandFromFilePath = (filePath: string) =>
	path.basename(filePath)?.replace(/\.(j|t)s$/, "") || ""

export let iconFromKenv = async (kenv: string) => {
	let iconPath = kenv ? kenvPath("kenvs", kenv, "icon.png") : ""

	return kenv && (await isFile(iconPath)) ? iconPath : ""
}

export let parseFilePath = async (
	filePath: string
): Promise<ScriptPathInfo> => {
	let command = commandFromFilePath(filePath)
	let kenv = kenvFromFilePath(filePath)
	let icon = await iconFromKenv(kenv)

	return {
		id: filePath,
		command,
		filePath,
		kenv,
		icon
	}
}

export let parseScript = async (filePath: string): Promise<Script> => {
	let parsedFilePath = await parseFilePath(filePath)

	let contents = await readFile(filePath, "utf8")

	let metadata = parseMetadata(contents)

	let shebang = getShebangFromContents(contents)

	let needsDebugger = Boolean(contents.match(/^\s*debugger/gim))

	let result = {
		shebang,
		...metadata,
		...parsedFilePath,
		needsDebugger,
		name: metadata.name || metadata.menu || parsedFilePath.command,
		description: metadata.description || ""
	}

	return result
}
