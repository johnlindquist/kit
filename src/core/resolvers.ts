import { homedir } from "node:os"
import * as path from "node:path"
export let createPathResolver =
	(parentDir: string) =>
	(...parts: string[]) => {
		return path.resolve(parentDir, ...parts)
	}

export let home = (...pathParts: string[]) => {
	return path.resolve(homedir(), ...pathParts)
}

export let kitPath = (...parts: string[]) =>
	path.join(process.env.KIT || home(".kit"), ...parts.filter(Boolean))

export let kenvPath = (...parts: string[]) => {
	return path.join(process.env.KENV || home(".kenv"), ...parts.filter(Boolean))
}

export let kitDotEnvPath = () => {
	return process.env.KIT_DOTENV_PATH || kenvPath(".env")
}

export let knodePath = (...parts: string[]) =>
	path.join(process.env.KNODE || home(".knode"), ...parts.filter(Boolean))
