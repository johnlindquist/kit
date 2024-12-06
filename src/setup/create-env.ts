// Check if .env already exists
const envPath = kenvPath(".env")
const alreadyExists = await pathExists(envPath)
if (!alreadyExists) {
	let envTemplatePath = kitPath("templates", "env", "template.env")

	let envTemplate = await readFile(envTemplatePath, "utf8")
	
	let envTemplateCompiler = compile(envTemplate)
	let compiledEnvTemplate = envTemplateCompiler({
		...process.env,
		KIT_MAIN_SHORTCUT: process.platform === "win32" ? "ctrl ;" : "cmd ;"
	})
	
	await writeFile(kenvPath(".env"), compiledEnvTemplate)
	  
}

export {}