import { config } from "@johnlindquist/kit-internal/dotenv-flow"
import { md as globalMd, marked } from "@johnlindquist/globals"

import * as path from "node:path"
import type {
	Script,
	Metadata,
	Shortcut,
	Scriptlet,
	Snippet
} from "../types/core"
import { lstatSync, realpathSync } from "node:fs"
import { lstat, readdir } from "node:fs/promises"
import { execSync } from "node:child_process"

import { Channel } from "./enum.js"
import {
	type AssignmentExpression,
	type Identifier,
	type ObjectExpression,
	Parser,
	type Program
} from "acorn"
import tsPlugin from "acorn-typescript"
import type { Stamp } from "./db"
import { pathToFileURL } from "node:url"
import { parseScript } from "./parser.js"
import { kitPath, kenvPath } from "./resolvers.js"
import { cmd } from "./constants.js"
import { isBin, isJsh, isDir, isWin, isMac } from "./is.js"

export let extensionRegex = /\.(mjs|ts|js)$/g

export let wait = async (time: number): Promise<void> =>
	new Promise((res) => setTimeout(res, time))

export let checkProcess = (pid: string | number) => {
	return execSync(`kill -0 ` + pid).buffer.toString()
}

export let combinePath = (arrayOfPaths: string[]): string => {
	const pathSet = new Set<string>()

	for (const p of arrayOfPaths) {
		if (p) {
			const paths = p.split(path.delimiter)
			for (const singlePath of paths) {
				if (singlePath) {
					pathSet.add(singlePath)
				}
			}
		}
	}

	return Array.from(pathSet).join(path.delimiter)
}

const UNIX_DEFAULT_PATH = combinePath([
	"/usr/local/bin",
	"/usr/bin",
	"/bin",
	"/usr/sbin",
	"/sbin"
])

const WIN_DEFAULT_PATH = combinePath([])

export const KIT_DEFAULT_PATH = isWin ? WIN_DEFAULT_PATH : UNIX_DEFAULT_PATH

export const KIT_BIN_PATHS = combinePath([
	kitPath("bin"),
	...(isWin ? [] : [kitPath("override", "code")]),
	kenvPath("bin")
])

export const KIT_FIRST_PATH = combinePath([
	KIT_BIN_PATHS,
	process?.env?.PATH,
	KIT_DEFAULT_PATH
])

export const KIT_LAST_PATH = combinePath([
	process.env.PATH,
	KIT_DEFAULT_PATH,
	KIT_BIN_PATHS
])

export let assignPropsTo = (
	source: { [s: string]: unknown } | ArrayLike<unknown>,
	target: { [x: string]: unknown }
) => {
	Object.entries(source).forEach(([key, value]) => {
		target[key] = value
	})
}

//app
let fileExists = (path: string) => {
	try {
		return lstatSync(path, {
			throwIfNoEntry: false
		})?.isFile()
	} catch {
		return false
	}
}

export let isScriptletPath = (filePath: unknown) => {
	return typeof filePath === "string" && filePath.includes(".md#")
}

//app
export let resolveToScriptPath = (
	rawScript: string,
	cwd: string = process.cwd()
): string => {
	let extensions = ["", ".js", ".ts", ".md"]
	let resolvedScriptPath = ""

	// Remove anchor from the end
	let script = rawScript.replace(/\#.*$/, "")

	// if (!script.match(/(.js|.mjs|.ts)$/)) script += ".js"
	if (fileExists(script)) return script

	// Check sibling scripts
	if (global.kitScript) {
		let currentRealScriptPath = realpathSync(global.kitScript)
		let maybeSiblingScriptPath = path.join(
			path.dirname(currentRealScriptPath),
			script
		)
		if (fileExists(maybeSiblingScriptPath)) {
			return maybeSiblingScriptPath
		}

		if (fileExists(maybeSiblingScriptPath + ".js")) {
			return maybeSiblingScriptPath + ".js"
		}

		if (fileExists(maybeSiblingScriptPath + ".ts")) {
			return maybeSiblingScriptPath + ".ts"
		}
	}

	// Check main kenv

	for (let ext of extensions) {
		resolvedScriptPath = kenvPath("scripts", script + ext)
		if (fileExists(resolvedScriptPath)) return resolvedScriptPath
	}

	// Check other kenvs
	let [k, s] = script.split("/")
	if (s) {
		for (let ext of extensions) {
			resolvedScriptPath = kenvPath("kenvs", k, "scripts", s + ext)
			if (fileExists(resolvedScriptPath)) return resolvedScriptPath
		}
	}

	// Check scripts dir

	for (let ext of extensions) {
		resolvedScriptPath = path.resolve(cwd, "scripts", script + ext)
		if (fileExists(resolvedScriptPath)) return resolvedScriptPath
	}

	// Check anywhere

	for (let ext of extensions) {
		resolvedScriptPath = path.resolve(cwd, script + ext)
		if (fileExists(resolvedScriptPath)) return resolvedScriptPath
	}

	throw new Error(`${script} not found`)
}

export let resolveScriptToCommand = (script: string) => {
	return path
		.basename(script)
		.replace(new RegExp(`\\${path.extname(script)}$`), "")
}

//app
export const shortcutNormalizer = (shortcut: string) =>
	shortcut
		? shortcut
				.replace(/(option|opt|alt)/i, isMac ? "Option" : "Alt")
				.replace(/(ctl|cntrl|ctrl|control)/, "Control")
				.replace(/(command|cmd)/i, isMac ? "Command" : "Control")
				.replace(/(shift|shft)/i, "Shift")
				.split(/\s/)
				.filter(Boolean)
				.map((part) => (part[0].toUpperCase() + part.slice(1)).trim())
				.join("+")
		: ""

export const friendlyShortcut = (shortcut: string) => {
	let f = ""
	if (shortcut.includes("Command+")) f += "cmd+"
	if (shortcut.match(/(?<!Or)Control\+/)) f += "ctrl+"
	if (shortcut.includes("Alt+")) f += "alt+"
	if (shortcut.includes("Option+")) f += "opt+"
	if (shortcut.includes("Shift+")) f += "shift+"
	if (shortcut.includes("+")) f += shortcut.split("+").pop()?.toLowerCase()

	return f
}

export let setMetadata = (
	contents: string,
	overrides: {
		[key: string]: string
	}
) => {
	Object.entries(overrides).forEach(([key, value]) => {
		let k = key[0].toUpperCase() + key.slice(1)
		// if not exists, then add
		if (!contents.match(new RegExp(`^\/\/\\s*(${key}|${k}):.*`, "gm"))) {
			// uppercase first letter
			contents = `// ${k}: ${value}
${contents}`.trim()
		} else {
			// if exists, then replace
			contents = contents.replace(
				new RegExp(`^\/\/\\s*(${key}|${k}):.*$`, "gm"),
				`// ${k}: ${value}`
			)
		}
	})
	return contents
}

const getMetadataFromComments = (contents: string): Record<string, string> => {
	const lines = contents.split("\n")
	const metadata = {}
	let commentStyle = null
	let spaceRegex = null
	let inMultilineComment = false
	let multilineCommentEnd = null

	const setCommentStyle = (style: string) => {
		commentStyle = style
		spaceRegex = new RegExp(`^${commentStyle} ?[^ ]`)
	}

	for (const line of lines) {
		// Check for the start of a multiline comment block
		if (
			!inMultilineComment &&
			(line.trim().startsWith("/*") ||
				line.trim().startsWith("'''") ||
				line.trim().startsWith('"""') ||
				line.trim().match(/^: '/))
		) {
			inMultilineComment = true
			multilineCommentEnd = line.trim().startsWith("/*")
				? "*/"
				: line.trim().startsWith(": '")
					? "'"
					: line.trim().startsWith("'''")
						? "'''"
						: '"""'
		}

		// Check for the end of a multiline comment block
		if (inMultilineComment && line.trim().endsWith(multilineCommentEnd)) {
			inMultilineComment = false
			multilineCommentEnd = null
			continue // Skip the end line of a multiline comment block
		}

		// Skip lines that are part of a multiline comment block
		if (inMultilineComment) continue

		// Determine the comment style based on the first encountered comment line
		if (commentStyle === null) {
			if (
				line.startsWith("//") &&
				(line[2] === " " || /[a-zA-Z]/.test(line[2]))
			) {
				setCommentStyle("//")
			} else if (
				line.startsWith("#") &&
				(line[1] === " " || /[a-zA-Z]/.test(line[1]))
			) {
				setCommentStyle("#")
			}
		}

		// Skip lines that don't start with the determined comment style
		if (
			commentStyle === null ||
			(commentStyle && !line.startsWith(commentStyle))
		)
			continue

		// Check for 0 or 1 space after the comment style
		if (!line.match(spaceRegex)) continue

		// Find the index of the first colon
		const colonIndex = line.indexOf(":")
		if (colonIndex === -1) continue

		// Extract key and value based on the colon index
		let key = line.substring(commentStyle.length, colonIndex).trim()

		if (key?.length > 0) {
			key = key[0].toLowerCase() + key.slice(1)
		}
		const value = line.substring(colonIndex + 1).trim()

		// Skip empty keys or values
		if (!key || !value) {
			continue
		}

		let parsedValue: string | boolean | number
		let lowerValue = value.toLowerCase()
		let lowerKey = key.toLowerCase()
		switch (true) {
			case lowerValue === "true":
				parsedValue = true
				break
			case lowerValue === "false":
				parsedValue = false
				break
			case lowerKey === "timeout":
				parsedValue = parseInt(value, 10)
				break
			default:
				parsedValue = value
		}

		// Only assign if the key hasn't been assigned before
		if (!(key in metadata)) {
			metadata[key] = parsedValue
		}
	}

	return metadata
}

function parseTypeScript(code: string) {
	const parser = Parser.extend(
		// @ts-expect-error Somehow these are not 100% compatible
		tsPlugin({ allowSatisfies: true })
	)
	return parser.parse(code, {
		sourceType: "module",
		ecmaVersion: "latest"
	})
}

function isOfType<T extends { type: string }, TType extends string>(
	node: T,
	type: TType
): node is T & { type: TType } {
	return node.type === type
}

function parseMetadataProperties(properties: ObjectExpression["properties"]) {
	return properties.reduce((acc, prop) => {
		if (!isOfType(prop, "Property")) {
			throw Error("Not a Property")
		}

		const key = prop.key
		const value = prop.value

		if (!isOfType(key, "Identifier")) {
			throw Error("Key is not an Identifier")
		}

		if (!isOfType(value, "Literal")) {
			throw Error(`value is not a Literal, but a ${value.type}`)
		}

		acc[key.name] = value.value
		return acc
	}, {})
}

function getMetadataFromExport(ast: Program): Partial<Metadata> {
	for (const node of ast.body) {
		const isExpressionStatement = isOfType(node, "ExpressionStatement")

		if (isExpressionStatement) {
			const expression = node.expression as AssignmentExpression

			const isMetadata = (expression.left as Identifier).name === "metadata"
			const isEquals = expression.operator === "="
			const properties = (expression.right as ObjectExpression).properties

			const isGlobalMetadata = isMetadata && isEquals

			if (isGlobalMetadata) {
				return parseMetadataProperties(properties)
			}
		}

		const isExportNamedDeclaration = isOfType(node, "ExportNamedDeclaration")

		if (!isExportNamedDeclaration || !node.declaration) {
			continue
		}

		const declaration = node.declaration

		if (
			declaration.type !== "VariableDeclaration" ||
			!declaration.declarations[0]
		) {
			continue
		}

		const namedExport = declaration.declarations[0]

		if (!("name" in namedExport.id) || namedExport.id.name !== "metadata") {
			continue
		}

		if (namedExport.init?.type !== "ObjectExpression") {
			continue
		}

		const properties = namedExport.init?.properties

		return parseMetadataProperties(properties)
	}

	// Nothing found
	return {}
}

//app
export let getMetadata = (contents: string): Metadata => {
	const fromComments = getMetadataFromComments(contents)

	// if (
	//   !/(const|var|let) metadata/g.test(contents) &&
	//   !/^metadata = {/g.test(contents)
	// ) {
	//   // No named export in file, return early
	//   return fromComments
	// }

	let ast: Program
	try {
		ast = parseTypeScript(contents)
	} catch (err) {
		// TODO: May wanna introduce some error handling here. In my script version, I automatically added an error
		//  message near the top of the user's file, indicating that their input couldn't be parsed...
		//  acorn-typescript unfortunately doesn't support very modern syntax, like `const T` generics.
		//  But it works in most cases.
		return fromComments
	}

	try {
		const fromExport = getMetadataFromExport(ast)
		return { ...fromComments, ...fromExport }
	} catch (err) {
		return fromComments
	}
}

export let getLastSlashSeparated = (string: string, count: number) => {
	return string.replace(/\/$/, "").split("/").slice(-count).join("/") || ""
}

export let kenvFromFilePath = (filePath: string) => {
	let { dir } = path.parse(filePath)
	let { name: scriptsName, dir: kenvDir } = path.parse(dir)
	if (scriptsName !== "scripts") return ".kit"
	let { name: kenv } = path.parse(kenvDir)
	if (path.relative(kenvDir, kenvPath()) === "") return ""
	return kenv
}

//app
export let getLogFromScriptPath = (filePath: string) => {
	let { name, dir } = path.parse(filePath)
	let { name: scriptsName, dir: kenvDir } = path.parse(dir)
	if (scriptsName !== "scripts") return kitPath("logs", "kit.log")

	return path.resolve(kenvDir, "logs", `${name}.log`)
}

//new RegExp(`(^//([^(:|\W)]+

export let stripMetadata = (fileContents: string, exclude: string[] = []) => {
	let excludeWithCommon = [`http`, `https`, `TODO`, `FIXME`, `NOTE`].concat(
		exclude
	)

	let negBehind = exclude.length ? `(?<!(${excludeWithCommon.join("|")}))` : ``

	return fileContents.replace(
		new RegExp(`(^//[^(:|\W|\n)]+${negBehind}:).+`, "gim"),
		"$1"
	)
}

export let stripName = (name: string) => {
	let strippedName = path.parse(name).name
	strippedName = strippedName.trim().replace(/\s+/g, "-").toLowerCase()
	strippedName = strippedName.replace(/[^\w-]+/g, "")
	strippedName = strippedName.replace(/-{2,}/g, "-")
	return strippedName
}

//validator
export let checkIfCommandExists = async (input: string) => {
	if (await isBin(kenvPath("bin", input))) {
		return global.chalk`{red.bold ${input}} already exists. Try again:`
	}

	if (await isDir(kenvPath("bin", input))) {
		return global.chalk`{red.bold ${input}} exists as group. Enter different name:`
	}

	if (await isBin(input)) {
		return global.chalk`{red.bold ${input}} is a system command. Enter different name:`
	}

	if (!input.match(/^([a-z]|[0-9]|\-|\/)+$/g)) {
		return global.chalk`{red.bold ${input}} can only include lowercase, numbers, and -. Enter different name:`
	}

	return true
}

export let getKenvs = async (ignorePattern = /^ignore$/): Promise<string[]> => {
	if (!(await isDir(kenvPath("kenvs")))) return []

	let dirs = await readdir(kenvPath("kenvs"), {
		withFileTypes: true
	})

	let kenvs = []
	for (let dir of dirs) {
		if (
			!dir.name.match(ignorePattern) &&
			(dir.isDirectory() || dir.isSymbolicLink())
		) {
			kenvs.push(kenvPath("kenvs", dir.name))
		}
	}

	return kenvs
}

export let kitMode = () => (process.env.KIT_MODE || "ts").toLowerCase()

global.__kitRun = false

let kitGlobalRunCount = 0
export let run = async (command: string, ...commandArgs: string[]) => {
	performance.mark("run")
	kitGlobalRunCount++
	let kitLocalRunCount = kitGlobalRunCount

	let scriptArgs = []
	let script = ""
	let match
	// This regex splits the command string into parts:
	// - Matches single-quoted strings: '[^']+?'
	// - Matches double-quoted strings: "[^"]+?"
	// - Matches one or more whitespace characters: \s+
	// This allows us to preserve quoted arguments as single units
	let splitRegex = /('[^']+?')|("[^"]+?")|\s+/
	let quoteRegex = /'|"/g
	let parts = command.split(splitRegex).filter(Boolean)

	for (let item of parts) {
		if (!script) {
			script = item.replace(quoteRegex, "")
		} else if (!item.match(quoteRegex)) {
			scriptArgs.push(...item.trim().split(/\s+/))
		} else {
			scriptArgs.push(item.replace(quoteRegex, ""))
		}
	}
	// In case a script is passed with a path, we want to use the full command
	if (script.includes(path.sep)) {
		script = command
		scriptArgs = []
	}
	let resolvedScript = resolveToScriptPath(script)
	global.projectPath = (...args) =>
		path.resolve(path.dirname(path.dirname(resolvedScript)), ...args)

	global.onTabs = []
	global.kitScript = resolvedScript
	global.kitCommand = resolveScriptToCommand(resolvedScript)
	let realProjectPath = projectPath()
	updateEnv(realProjectPath)
	if (process.env.KIT_CONTEXT === "app") {
		let script = await parseScript(global.kitScript)

		if (commandArgs.includes(`--${cmd}`)) {
			script.debug = true
			global.send(Channel.DEBUG_SCRIPT, script)

			return await Promise.resolve("Debugging...")
		}

		cd(realProjectPath)

		global.send(Channel.SET_SCRIPT, script)
	}

	let result = await global.attemptImport(
		resolvedScript,
		...scriptArgs,
		...commandArgs
	)

	global.flag.tab = ""

	return result
}

export let updateEnv = (scriptProjectPath: string) => {
	let { parsed, error } = config({
		node_env: process.env.NODE_ENV || "development",
		path: scriptProjectPath,
		silent: true
	})

	if (parsed) {
		assignPropsTo(process.env, global.env)
	}

	if (error) {
		let isCwdKenv = path.normalize(cwd()) === path.normalize(kenvPath())
		if (
			isCwdKenv &&
			!error?.message?.includes("files matching pattern") &&
			!process.env.CI
		) {
			global.log(error.message)
		}
	}
}

export let configEnv = () => {
	let { parsed, error } = config({
		node_env: process.env.NODE_ENV || "development",
		path: process.env.KIT_DOTENV_PATH || kenvPath(),
		silent: true
	})

	if (error) {
		let isCwdKenv = path.normalize(cwd()) === path.normalize(kenvPath())
		if (
			isCwdKenv &&
			!error?.message?.includes("files matching pattern") &&
			!process.env.CI
		) {
			global.log(error.message)
		}
	}

	process.env.PATH_FROM_DOTENV = combinePath([parsed?.PATH || process.env.PATH])

	process.env.PATH = combinePath([process.env.PARSED_PATH, KIT_FIRST_PATH])

	assignPropsTo(process.env, global.env)

	return parsed
}

export let trashScriptBin = async (script: Script) => {
	let { command, kenv, filePath } = script
	let { pathExists } = await import("@johnlindquist/kit-internal/fs-extra")

	let binJSPath = isJsh()
		? kenvPath("node_modules", ".bin", command + ".js")
		: kenvPath(kenv && `kenvs/${kenv}`, "bin", command + ".js")

	let binJS = await pathExists(binJSPath)
	let { name, dir } = path.parse(filePath)
	let commandBinPath = path.resolve(path.dirname(dir), "bin", name)

	if (process.platform === "win32") {
		if (!commandBinPath.endsWith(".cmd")) {
			commandBinPath += ".cmd"
		}
	}

	if (binJS) {
		let binPath = isJsh()
			? kenvPath("node_modules", ".bin", command)
			: commandBinPath

		await global.trash([binPath, ...(binJS ? [binJSPath] : [])])
	}

	if (await pathExists(commandBinPath)) {
		await global.trash(commandBinPath)
	}
}

export let trashScript = async (script: Script) => {
	let { filePath } = script

	await trashScriptBin(script)

	let { pathExists } = await import("@johnlindquist/kit-internal/fs-extra")

	await global.trash([...((await pathExists(filePath)) ? [filePath] : [])])

	await wait(100)
}

export let getScriptFiles = async (kenv = kenvPath()) => {
	let scriptsPath = path.join(kenv, "scripts")
	try {
		let dirEntries = await readdir(scriptsPath)
		let scriptFiles = []
		for (let fileName of dirEntries) {
			if (!fileName.startsWith(".")) {
				let fullPath = path.join(scriptsPath, fileName)
				if (!path.extname(fileName)) {
					try {
						let stats = await lstat(fullPath)
						if (!stats.isDirectory()) {
							scriptFiles.push(fullPath)
						}
					} catch (error) {
						log(error)
					}
				} else {
					scriptFiles.push(fullPath)
				}
			}
		}
		return scriptFiles
	} catch {
		return []
	}
}

export let scriptsSort = (timestamps: Stamp[]) => (a: Script, b: Script) => {
	let aTimestamp = timestamps.find((t) => t.filePath === a.filePath)
	let bTimestamp = timestamps.find((t) => t.filePath === b.filePath)

	if (aTimestamp && bTimestamp) {
		return bTimestamp.timestamp - aTimestamp.timestamp
	}

	if (aTimestamp) {
		return -1
	}

	if (bTimestamp) {
		return 1
	}

	if (a?.index || b?.index) {
		if ((a?.index || 9999) < (b?.index || 9999)) return -1
		else return 1
	}

	let aName = (a?.name || "").toLowerCase()
	let bName = (b?.name || "").toLowerCase()

	return aName > bName ? 1 : aName < bName ? -1 : 0
}

export let isParentOfDir = (parent: string, dir: string) => {
	let relative = path.relative(parent, dir)
	return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
}

export let isInDir = (parentDir: string) => (dir: string) => {
	const relative = path.relative(parentDir, dir)
	return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
}

export let escapeShortcut: Shortcut = {
	name: `Escape`,
	key: `escape`,
	bar: "left",
	onPress: async () => {
		exit()
	}
}

export let backToMainShortcut: Shortcut = {
	name: `Back`,
	key: `escape`,
	bar: "left",
	onPress: async () => {
		await mainScript()
	}
}

export let closeShortcut: Shortcut = {
	name: "Exit",
	key: `${cmd}+w`,
	bar: "right",
	onPress: () => {
		exit()
	}
}

export let editScriptShortcut: Shortcut = {
	name: "Edit Script",
	key: `${cmd}+o`,
	onPress: async (input, { script }) => {
		await run(kitPath("cli", "edit-script.js"), script?.filePath)
	},
	bar: "right"
}

export let submitShortcut: Shortcut = {
	name: "Submit",
	key: `${cmd}+s`,
	bar: "right",
	onPress: async (input) => {
		await submit(input)
	}
}

export let viewLogShortcut: Shortcut = {
	name: "View Log",
	key: `${cmd}+l`,
	onPress: async (input, { focused }) => {
		await run(kitPath("cli", "open-script-log.js"), focused?.value?.scriptPath)
	},
	bar: "right",
	visible: true
}

export let terminateProcessShortcut: Shortcut = {
	name: "Terminate Process",
	key: `${cmd}+enter`,
	onPress: async (input, { focused }) => {
		await sendWait(Channel.TERMINATE_PROCESS, focused?.value?.pid)
	},
	bar: "right",
	visible: true
}

export let terminateAllProcessesShortcut: Shortcut = {
	name: "Terminate All Processes",
	key: `${cmd}+shift+enter`,
	onPress: async () => {
		await sendWait(Channel.TERMINATE_ALL_PROCESSES)
	},
	bar: "right",
	visible: true
}

export let smallShortcuts: Shortcut[] = [
	// escapeShortcut,
	closeShortcut
]

export let argShortcuts: Shortcut[] = [
	// escapeShortcut,
	closeShortcut,
	editScriptShortcut
]

export let editorShortcuts: Shortcut[] = [
	closeShortcut,
	editScriptShortcut,
	submitShortcut
]

export let defaultShortcuts: Shortcut[] = [
	// escapeShortcut,
	closeShortcut,
	editScriptShortcut,
	submitShortcut
]

export let divShortcuts: Shortcut[] = [
	// escapeShortcut,
	closeShortcut,
	{
		...editScriptShortcut,
		bar: ""
	}
]

export let formShortcuts: Shortcut[] = [
	// escapeShortcut,
	{
		...editScriptShortcut,
		bar: ""
	},
	closeShortcut,
	{
		name: "Reset",
		key: `${cmd}+alt+r`,
		bar: ""
	}
]

export let cliShortcuts: Shortcut[] = [
	// escapeShortcut,
	closeShortcut
]

let kitFilePath = (...paths: string[]) =>
	pathToFileURL(kitPath("images", ...paths)).href
let iconPath = kitFilePath("icon.svg")
let kentPath = kitFilePath("kent.jpg")
let mattPath = kitFilePath("matt.jpg")

const checkmarkStyles = `
  <style>
    .checkmark-list {
      list-style-type: none !important;
      padding-left: 0 !important;
    }
    .checkmark-list li {
      padding-left: 1.5em;
      position: relative;
    }
    .checkmark-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--color-primary);
    }
    .checkmark-list li::marker {
      content: none !important;
    }
  </style>
`
export let proPane = () =>
	`
  ${checkmarkStyles}


<svg width="0" height="0">
  <defs>
    <filter id="dropShadow" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceAlpha" dx="0" dy="3" />
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter>
  </defs>
</svg>

<div class="px-8">
<div class="flex flex-col items-center">
  <img src="${iconPath}" alt="Script Kit Pro" class="mx-auto mt-4 mb-3"  style="width: 50px; height: 50px; filter: url(#dropShadow);">
  <h3 class="text-2xl font-bold my-1">Script Kit Pro</h3>
  <p class="text-lg -mt-1">$7 / month</p>
  <a href="submit:pro" class="shadow-lg shadow-primary/25 max-w-52 text-center text-bg-base font-bold px-3 py-3 h-12 no-underline rounded bg-primary bg-opacity-100 hover:shadow-md hover:shadow-primary/10">Unlock All Features</a>
  <p class="text-xs mt-3">Cancel anytime</p>
</div>

<hr class="mt-4 -mb-2">

<div class="flex">
  <div class="list-inside flex-1">
    <h3 class="text-xl font-bold">Pro Features</h3>
    <ul class="checkmark-list">
    <li>Debugger</li>
    <li>Unlimited Active Prompts</li>
    <li>Script Log Window</li>
    <li>Vite Widgets</li>
      <li>Webcam Capture</li>
      <li>Screenshots</li>
      <li>Desktop Color Picker</li>
      <li>Support through Discord</li>
    </ul>
  </div>

  <div class="list-inside flex-1">
    <h3 class="text-xl font-bold">Planned Features...</h3>
    <ul class="checkmark-list">
      <li>Sync Scripts to GitHub Repo</li>
      <li>Run Script Remotely as GitHub Actions</li>
      <li>Screen Recording</li>      
      <li>Measure Tool</li>
    </ul>
  </div>
</div>

<hr class="my-4">

<h3 class="text-xl font-bold">What the community is saying</h3>
<div class="flex flex-row">
  
  <div class="flex flex-col w-1/2 pr-8">
    <div class="flex flex-row items-center -mb-2">
    <img src="${kentPath}" alt="Kent C. Dodds" class="rounded-full mx-auto" style="width: 40px; height: 40px;">
    <p class="font-bold text-lg ml-2 mb-0">Kent C. Dodds</p>
    </div>
    <p class="text-sm text-left">I forgot that a lot of people don't know what Script Kit is. <strong>You're missing out!</strong> I use it to easily open projects in VSCode, start a zoom meeting and put the link in my clipboard, download Twitter images, upload images to cloudinary, and so much more!</p>
  </div>


  <div class="flex flex-col w-1/2">
  <div class="flex flex-row items-center -mb-2">
    <img src="${mattPath}" alt="Matt Pocock" class="rounded-full mx-auto" style="width: 40px; height: 40px;">
    <p class="font-bold text-lg ml-2 mb-0">Matt Pocock</p>
    </div>
    <p class="text-sm text-left">So, <strong>Script Kit is AMAZING.</strong> Just spent a very happy morning figuring out a script where it takes my latest recording from OBS and trims the silence from the start and end with ffmpeg. Now, it's just a command palette action away.</p>
  </div>
  </div>
  
  </div>
`

export const getShellSeparator = () => {
	let separator = "&&"
	if (process.platform === "win32") {
		separator = "&"
	}
	// if powershell
	if (
		process.env.KIT_SHELL?.includes("pwsh") ||
		process.env.KIT_SHELL?.includes("powershell") ||
		process.env.SHELL?.includes("pwsh") ||
		process.env.SHELL?.includes("powershell") ||
		process.env.ComSpec?.includes("powershell") ||
		process.env.ComSpec?.includes("pwsh")
	) {
		separator = ";"
	}

	if (
		process.env.KIT_SHELL?.includes("fish") ||
		process.env.SHELL?.includes("fish")
	) {
		separator = ";"
	}

	return separator
}

export let getTrustedKenvsKey = () => {
	let username =
		process.env?.USER || process.env?.USERNAME || "NO_USER_ENV_FOUND"

	let formattedUsername = username.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()

	let trustedKenvKey = `KIT_${formattedUsername}_DANGEROUSLY_TRUST_KENVS`

	return trustedKenvKey
}

export const uniq = (array: any[]): any[] => {
	if (!Array.isArray(array)) {
		throw new Error("Input should be an array")
	}
	return [...new Set(array)]
}

interface DebounceSettings {
	leading?: boolean
	trailing?: boolean
}

type Procedure = (...args: any[]) => void

type DebouncedFunc<T extends Procedure> = (...args: Parameters<T>) => void

export const debounce = <T extends Procedure>(
	func: T,
	waitMilliseconds = 0,
	options: DebounceSettings = {}
): DebouncedFunc<T> => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	return (...args: Parameters<T>) => {
		const doLater = () => {
			timeoutId = undefined
			// If trailing is enabled, we invoke the function only if the function was invoked during the wait period
			if (options.trailing !== false) {
				func(...args)
			}
		}

		const shouldCallNow = options.leading && timeoutId === undefined

		// Always clear the timeout
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId)
		}

		timeoutId = setTimeout(doLater, waitMilliseconds)

		// If leading is enabled and no function call has been scheduled, we call the function immediately
		if (shouldCallNow) {
			func(...args)
		}
	}
}

export const range = (start: number, end: number, step = 1): number[] => {
	return Array.from(
		{ length: Math.ceil((end - start) / step) },
		(_, i) => start + i * step
	)
}

type Iteratee<T> = ((item: T) => any) | keyof T

export let sortBy = <T>(collection: T[], iteratees: Iteratee<T>[]): T[] => {
	const iterateeFuncs = iteratees.map((iteratee) =>
		typeof iteratee === "function"
			? iteratee
			: (item: T) => item[iteratee as keyof T]
	)

	return [...collection].sort((a, b) => {
		for (const iteratee of iterateeFuncs) {
			const valueA = iteratee(a)
			const valueB = iteratee(b)

			if (valueA < valueB) {
				return -1
			} else if (valueA > valueB) {
				return 1
			}
		}

		return 0
	})
}

export let isUndefined = (value: any): value is undefined => {
	return value === undefined
}

export let isString = (value: any): value is string => {
	return typeof value === "string"
}

export let getCachePath = (filePath: string, type: string) => {
	// Normalize file path
	const normalizedPath = path.normalize(filePath)

	// Replace all non-alphanumeric characters and path separators with dashes
	let dashedName = normalizedPath.replace(/[^a-zA-Z0-9]/g, "-")

	// Remove leading dashes
	while (dashedName.charAt(0) === "-") {
		dashedName = dashedName.substr(1)
	}

	// Replace multiple consecutive dashes with a single dash
	dashedName = dashedName.replace(/-+/g, "-")

	// Append .json extension
	return kitPath("cache", type, `${dashedName}.json`)
}

export let adjustPackageName = (packageName: string) => {
	let adjustedPackageName = ""
	if (packageName.startsWith("@")) {
		let parts = packageName.split("/")
		adjustedPackageName = `${parts[0]}/${parts[1]}`
	} else {
		adjustedPackageName = packageName.split("/")[0]
	}

	return adjustedPackageName
}

export let keywordInputTransformer = (keyword: string) => {
	if (!keyword) return (input: string) => input

	let keywordRegex = new RegExp(`(?<=${global.arg.keyword}\\s)(.*)`, "gi")

	return (input: string) => {
		return input.match(keywordRegex)?.[0] || ""
	}
}

export let escapeHTML = (text: string) => {
	// Handle null or undefined input
	if (!text || typeof text !== "string") return ""

	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;"
	}

	// Perform HTML escape on the updated text
	text = text.replace(/[&<>"']/g, function (m) {
		return map[m]
	})

	// Convert tabs to spaces
	text = text.replace(/\t/g, "    ")

	// Convert newline characters to <br/>
	return text.replace(/\n/g, "<br/>")
}

export let processInBatches = async <T>(
	items: Promise<T>[],
	batchSize: number
): Promise<T[]> => {
	let result: T[] = []
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize)
		const batchResults = await Promise.all(batch)
		result = result.concat(batchResults)
	}
	return result
}

export let md = (content = "", containerClasses = "p-5 prose prose-sm") => {
	return globalMd(content + "\n", containerClasses)
}

export let highlight = async (
	markdown: string,
	containerClass = "p-5 leading-loose",
	injectStyles = ""
) => {
	let { default: highlight } =
		global.__kitHighlight || (await import("highlight.js"))
	if (!global.__kitHighlight) global.__kitHighlight = { default: highlight }

	let renderer = new marked.Renderer()
	renderer.paragraph = (p) => {
		// Convert a tag with href .mov, .mp4, or .ogg video links to video tags
		if (p.match(/<a href=".*\.(mov|mp4|ogg)">.*<\/a>/)) {
			let url = p.match(/href="(.*)"/)[1]
			return `<video controls src="${url}" style="max-width: 100%;"></video>`
		}

		return `<p>${p}</p>`
	}

	renderer.text = (text) => {
		return `<span>${text}</span>`
	}
	marked.setOptions({
		renderer,
		// biome-ignore lint/complexity/useArrowFunction: <explanation>
		highlight: function (code, lang) {
			const language = highlight.getLanguage(lang) ? lang : "plaintext"
			return highlight.highlight(code, { language }).value
		},
		langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
		pedantic: false,
		gfm: true,
		breaks: false,
		sanitize: false,
		smartLists: true,
		smartypants: false,
		xhtml: false
	})

	let highlightedMarkdown = marked(markdown)

	let result = `<div class="${containerClass}">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  ${injectStyles}
  </style>
  ${highlightedMarkdown}
</div>`

	return result
}

export let tagger = (script: Script) => {
	if (!script.tag) {
		let tags = []

		if (script.friendlyShortcut) {
			tags.push(script.friendlyShortcut)
		} else if (script.shortcut) {
			tags.push(friendlyShortcut(shortcutNormalizer(script.shortcut)))
		}

		if (script.trigger) tags.push(`trigger: ${script.trigger}`)
		if (script.keyword) tags.push(`keyword: ${script.keyword}`)
		if (script.snippet) tags.push(`snippet ${script.snippet}`)

		if (typeof script.pass === "string" && script.pass !== "true") {
			tags.push(
				script.pass.startsWith("/")
					? `pattern: ${script.pass}`
					: `postfix: ${script.pass}`
			)
		}

		script.tag = tags.join(" ")
	}
}

export let getKenvFromPath = (filePath: string): string => {
	let normalizedPath = path.normalize(filePath)
	let normalizedKenvPath = path.normalize(kenvPath())

	if (!normalizedPath.startsWith(normalizedKenvPath)) {
		return ""
	}

	let relativePath = normalizedPath.replace(normalizedKenvPath, "")
	if (!relativePath.includes("kenvs")) {
		return ""
	}

	let parts = relativePath.split(path.sep)
	let kenvIndex = parts.indexOf("kenvs")
	return kenvIndex !== -1 && parts[kenvIndex + 1] ? parts[kenvIndex + 1] : ""
}

export let isScriptlet = (script: Script | Scriptlet): script is Scriptlet => {
	return "scriptlet" in script
}

export let isSnippet = (script: Script): script is Snippet => {
	return "text" in script
}

export let processPlatformSpecificTheme = (cssString: string): string => {
	const platform = process.platform
	const platformSuffix =
		platform === "darwin" ? "-mac" : platform === "win32" ? "-win" : "-other"

	// Split the CSS string into lines
	const lines = cssString.split("\n")

	// Process each line
	const processedLines = lines.map((line) => {
		// Check if the line contains a CSS variable
		if (line.includes("--") && line.includes(":")) {
			const parts = line.split(":")
			const variableName = parts[0].trim()

			// Check if the variable ends with a platform suffix
			if (
				variableName.endsWith("-mac") ||
				variableName.endsWith("-win") ||
				variableName.endsWith("-other")
			) {
				// If it matches the current platform, remove the suffix
				if (variableName.endsWith(platformSuffix)) {
					return `    ${variableName.slice(0, -platformSuffix.length)}: ${parts[1].trim()}`
				}
				// If it doesn't match, remove the line
				return null
			}
		}
		// If it's not a platform-specific variable, keep the line as is
		return line
	})

	// Join the processed lines, filtering out null values
	return processedLines.filter((line) => line !== null).join("\n")
}

export let infoPane = (title: string, description?: string) => {
	return `<div class="w-full h-full flex items-center justify-center -mt-4">
	<div class="text-center -mt-2">
		<h1 class="text-2xl font-bold">${title}</h1>
		<p class="text-sm text-secondary">${description}</p>
	</div>
</div>`
}

// TODO: Clean-up re-exports
export {
	parseScript,
	commandFromFilePath,
	getShebangFromContents,
	iconFromKenv,
	parseFilePath,
	parseMetadata,
	postprocessMetadata
} from "./parser.js"

export {
	defaultGroupClassName,
	defaultGroupNameClassName,
	formatChoices
} from "./format.js"

export { groupChoices } from "./group.js"
export {
	parseScriptletsFromPath,
	parseMarkdownAsScriptlets,
	parseScriptlets
} from "./scriptlets.js"

export {
	getSnippet,
	parseSnippets
} from "./snippets.js"

export {
	createPathResolver,
	home,
	kitPath,
	kenvPath,
	kitDotEnvPath
} from "./resolvers.js"

export { isBin, isFile, isJsh, isDir, isLinux, isMac, isWin } from "./is.js"
export {
	cmd,
	returnOrEnter,
	scriptsDbPath,
	timestampsPath,
	statsPath,
	prefsPath,
	promptDbPath,
	themeDbPath,
	userDbPath,
	tmpClipboardDir,
	tmpDownloadsDir,
	getMainScriptPath,
	kitDocsPath,
	KENV_SCRIPTS,
	KENV_APP,
	KENV_BIN,
	KIT_APP,
	KIT_APP_PROMPT,
	KIT_APP_INDEX,
	SHELL_TOOLS
} from "./constants.js"
