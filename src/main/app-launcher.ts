import { pathToFileURL } from "url"
import { escapeShortcut, cmd, sortBy, uniq } from "../core/utils.js"
// Name: App Launcher
// Description: Select an App to Launch
// Trigger: ;
// Cache: true

if (isLinux) exit()

if (!flag.prep) {
	preload()
}

let findAppsAndPrefs = async () => {
	if (process.platform === "darwin") {
		let foundApps = await fileSearch("", {
			onlyin: "/",
			kMDItemContentType: "com.apple.application-bundle"
		})
		const APP_DIR = "/Applications"
		const UTILITIES_DIR = `${APP_DIR}/Utilities`
		const CHROME_APPS_DIR = home("Applications", "Chrome Apps.localized")

		let manualAppDir = (await readdir(APP_DIR)).map(
			(app) => `${APP_DIR}/${app}`
		)
		let manualUtilitiesDir = (await readdir(UTILITIES_DIR)).map(
			(app) => `${UTILITIES_DIR}/${app}`
		)
		let chromeApps = []
		if (await isDir(CHROME_APPS_DIR)) {
			chromeApps = (await readdir(CHROME_APPS_DIR)).map(
				(app) => `${CHROME_APPS_DIR}/${app}`
			)
		}

		let apps = manualAppDir
			.concat(chromeApps, manualUtilitiesDir)
			.filter((app) => app.endsWith(".app"))

		for (let a of foundApps) {
			let base = path.basename(a)
			let same = apps.find((app) => path.basename(app) === base)
			if (!same) {
				apps.push(a)
			}
		}

		// apps = uniq(apps.filter(a => !a.includes("Users")))
		let prefs = await fileSearch("", {
			onlyin: "/",
			kind: "preferences"
		})
		return {
			apps,
			prefs
		}
	}
	if (process.platform === "win32") {
		let globalApps = await fileSearch("", {
			onlyin: '"%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs"',
			kind: "application"
		})
		let apps = await fileSearch("", {
			onlyin: '"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs"',
			kind: "application"
		})
		return {
			apps: [...globalApps, ...apps],
			prefs: []
		}
	}
}
let createChoices = async () => {
	let extractIcon =
		process.platform === "win32"
			? (await npm("get-app-icon")).extractIcon
			: () => Promise.resolve(undefined)
	setLoading(true)
	let { apps, prefs } = await findAppsAndPrefs()
	let allApps = uniq(apps.concat(prefs)).filter((appPath) => {
		if (appPath.includes("/opt/")) return false
		if (appPath.includes("/Updater.app")) return false
		if (appPath.includes("(Parallels)")) return false
		if (appPath.includes("/Contents/")) return false
		if (appPath.includes("/Uninstall")) return false
		if (appPath.includes("/PrivateFrameworks")) return false

		return true
	})

	let assetsPath = kitPath("assets", "app-launcher", "icons")
	if (process.platform === "darwin") {
		let { fileIconToFile } = await npm("file-icon")
		await ensureDir(assetsPath)
		let allApps = uniq(apps.concat(prefs))

		let destination = allApps.map((appPath) => {
			let { base: appName } = path.parse(appPath)
			return path.resolve(assetsPath, `${appName}.png`)
		})

		log(`Creating icons for ${allApps.length} apps`)
		await fileIconToFile(allApps, {
			size: 48,
			destination
		})

		log(`Done creating icons`)
	}

	let choices = sortBy(
		await Promise.all(
			allApps.map(async (appPath) => {
				let { base: appName } = path.parse(appPath)
				let img = path.resolve(assetsPath, `${appName}.png`)
				let value = appPath.replace(/\r?\n?$/i, "")

				if (isWin) {
					try {
						let data = await extractIcon(appPath.trim()).catch(() => undefined)
						let buff = Buffer.from(
							data.replace(/^data:image\/png;base64,/, ""),
							"base64"
						)
						await ensureDir(path.dirname(img))
						await writeFile(img, buff)
					} catch (error) {}
				}

				return {
					id: value,
					name: appName.replace(/\.(app|lnk|url)\s*$/i, ""),
					value,
					description: appPath.replace(/\r?\n?$/i, ""),
					img: pathToFileURL(img).href,
					enter: `Open`
				}
			})
		),
		["value", "name"]
	)

	return choices
}
let appsDb = await db(
	kitPath("db", "apps.json"),
	async () => {
		setResize(true)
		setChoices([
			{
				name: `First Run: Indexing Apps and Caching Icons...`,
				description: `Please hold a few seconds while Script Kit creates icons for your apps and preferences for future use.`,
				info: true
			}
		])

		clearTabs()
		setPlaceholder(`One sec...`)

		let choices = await createChoices()
		return {
			choices
		}
	},
	!flag?.refresh
)

if (flag?.prep) {
	exit()
} else {
	let app = await arg(
		{
			key: "app-launcher",
			input: (flag?.input as string) || "",
			resize: true,
			placeholder: "Select an app to launch",
			shortcuts: [
				escapeShortcut,
				{
					name: "Refresh Apps",
					visible: true,
					key: `${cmd}+enter`,
					bar: "right",
					onPress: async (input) => {
						setPlaceholder(`Refreshing apps...`)
						await run(
							kitPath("main", "app-launcher.js"),
							"--input",
							input,
							"--refresh"
						)
					}
				}
			]
		},
		appsDb.choices as any
	)
	if (app) {
		open(app)
	}
}
