import { constants } from "node:fs"
import { platform } from "node:os"

export let isWin = platform().startsWith("win")
export let isMac = platform().startsWith("darwin")
export let isLinux = platform().startsWith("linux")

export let isJsh = () => {
	return process.env?.SHELL?.includes("jsh")
}

export let isDir = async (dir: string): Promise<boolean> => {
	try {
		try {
			let stats = await lstat(dir).catch(() => {
				return {
					isDirectory: () => false
				}
			})

			return stats?.isDirectory()
		} catch (error) {
			log(error)
		}

		return false
	} catch {
		return false
	}
}

export let isFile = async (file: string): Promise<boolean> => {
	try {
		await access(file, constants.F_OK)
		let stats = await lstat(file).catch(() => {
			return {
				isFile: () => false
			}
		})
		return stats?.isFile()
	} catch {
		return false
	}
}

export let isBin = async (bin: string): Promise<boolean> => {
	if (isJsh()) return false
	try {
		const result = spawnSync("command", ["-v", bin], {
			stdio: "ignore",
			windowsHide: true
		})
		return result.status === 0
	} catch {
		return false
	}
}
