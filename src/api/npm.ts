import { pathToFileURL } from "node:url"
import { adjustPackageName } from "../core/utils.js"

let defaultImport = async (modulePath: string) => {
	let pkg = await import(modulePath)
	if (pkg.default) return pkg.default
	return pkg
}

interface PackageJson {
	main?: string
	module?: string
	exports?: any
	type?: string
}

let workflowLog =
	(color: "green" | "yellow" | "red" | "blue" | "magenta" | "cyan" | "white") =>
	(...messages: any[]) => {
		if (process.env.KIT_CONTEXT === "workflow") {
			// if any of the message items are not a string, convert them to a string
			for (let message of messages) {
				if (typeof message !== "string") {
					message = JSON.stringify(message)
				}
				global.echo(global.chalk`{${color} ${message}}`)
			}
		}
	}

let wlog = workflowLog("green")
let wwarn = workflowLog("yellow")
let werror = workflowLog("red")

let findMain = async (packageJsonPath: string, packageJson: PackageJson) => {
	try {
		let kPath = (...pathParts: string[]) =>
			path.resolve(path.dirname(packageJsonPath), ...pathParts)

		let { module, main, type, exports } = packageJson

		if (module && type === "module") return kPath(module)
		if (main && (await global.isFile(kPath(main)))) return kPath(main)
		if (main?.endsWith(".js")) return kPath(main)
		if (main && !main.endsWith(".js")) {
			// Author forgot to add .js
			if (await global.isFile(kPath(`${main}.js`))) {
				return kPath(`${main}.js`)
			}

			// "main" is just a path that contains index.js
			if (await global.isFile(kPath(main, "index.js"))) {
				return kPath(main, "index.js")
			}
		}
		if (exports) {
			if (exports?.["."]) {
				if (typeof exports?.["."] === "string") return kPath(exports?.["."])
				if (exports?.["."]?.import?.default)
					return kPath(exports?.["."]?.import?.default)
				if (exports?.["."]?.import) return kPath(exports?.["."]?.import)
				if (exports?.["."]?.require?.default)
					return kPath(exports?.["."]?.require?.default)
				if (exports?.["."]?.require) return kPath(exports?.["."]?.require)
			}
		}
		return kPath("index.js")
	} catch (error) {
		throw new Error(error)
	}
}

let findPackageJson =
	(packageName: string) =>
	async (parent = "") => {
		let packageJsonPath = global.kenvPath(
			parent,
			"node_modules",
			packageName,
			"package.json"
		)

		if (!(await global.isFile(packageJsonPath))) {
			return false
		}

		let pkgPackageJson = JSON.parse(
			await global.readFile(packageJsonPath, "utf-8")
		)

		let mainModule = await findMain(packageJsonPath, pkgPackageJson)

		return mainModule || false
	}

let kenvImport = async (packageName: string) => {
	wlog(`Importing ${packageName}...`)
	packageName = adjustPackageName(packageName)

	try {
		// if the `node:` protocol is used, just go ahead and import it
		if (packageName.startsWith("node:")) {
			return await defaultImport(packageName)
		}

		let findMainFromPackageJson = findPackageJson(packageName)

		wlog(`Finding main`, { findMainFromPackageJson })

		let mainModule = await findMainFromPackageJson("")

		wlog(`mainModule`, { mainModule })
		if (mainModule) {
			if (process.env.KIT_CONTEXT === "workflow") {
				log(`mainModule:`, mainModule)
			}

			return await defaultImport(pathToFileURL(mainModule).toString())
		}

		if (process.env?.SCRIPTS_DIR) {
			if (process.env.KIT_CONTEXT === "workflow") {
				log(`SCRIPTS_DIR:`, process.env.SCRIPTS_DIR)
			}
			mainModule = await findMainFromPackageJson(process.env.SCRIPTS_DIR)
			if (mainModule) {
				if (process.env.KIT_CONTEXT === "workflow") {
					log(`mainModule:`, mainModule)
				}
				return await defaultImport(pathToFileURL(mainModule).toString())
			}
		}

		throw new Error(`Could not find main module for ${packageName}`)
	} catch (error) {
		throw new Error(error)
	}
}

export let createNpm =
	(npmInstall, attemptImport = true) =>
	async (packageNameWithVersion) => {
		// remove any version numbers
		let packageName = packageNameWithVersion.replace(/(?<=.)(@|\^|~).*/g, "")
		let { dependencies: kitDeps = {}, devDependencies: devDeps = {} } =
			JSON.parse(await global.readFile(global.kitPath("package.json"), "utf-8"))
		let isKitDep = kitDeps[packageName] || devDeps[packageName]
		if (isKitDep) {
			return defaultImport(packageName)
		}

		let pkgPath = global.kenvPath(process.env.SCRIPTS_DIR || "", "package.json")

		if (!(await global.isFile(pkgPath))) {
			throw new Error(`Could not find package.json at ${pkgPath}`)
		}

		//fix missing kenv dep
		let { dependencies: kenvDeps = {}, devDependencies: kenvDevDeps = {} } =
			JSON.parse(await global.readFile(pkgPath, "utf-8"))

		let isKenvDep = kenvDeps?.[packageName] || kenvDevDeps?.[packageName]

		if (isKenvDep) {
			global.log(`Found ${packageName} in ${pkgPath}`)
			return kenvImport(packageName)
		}
		await npmInstall(packageNameWithVersion)
		if (attemptImport) {
			return await kenvImport(packageName)
		}
	}

export let createKenvPackageMissingInstall =
	(npmInstall, attemptImport = true) =>
	async (packageNameWithVersion) => {
		// remove any version numbers
		let packageName = packageNameWithVersion.replace(/(?<=.)(@|\^|~).*/g, "")

		packageName = adjustPackageName(packageName)

		let pkgPath = global.kenvPath(process.env.SCRIPTS_DIR || "", "package.json")

		if (!(await global.isFile(pkgPath))) {
			throw new Error(`Could not find package.json at ${pkgPath}`)
		}

		//fix missing kenv dep
		let { dependencies: kenvDeps = {}, devDependencies: kenvDevDeps = {} } =
			JSON.parse(await global.readFile(pkgPath, "utf-8"))

		let isKenvDep = kenvDeps?.[packageName] || kenvDevDeps?.[packageName]

		if (isKenvDep) {
			global.log(`Found ${packageName} in ${pkgPath}`)
			return kenvImport(packageName)
		}
		await npmInstall(packageNameWithVersion)
		if (attemptImport) {
			return await kenvImport(packageName)
		}
	}
