import { exit } from "node:process"
import shelljs from "shelljs"
import { execaCommand as exec } from "execa"
import path from "node:path"

let { cd, cp } = shelljs

let kitPath = (...pathParts) => path.resolve(process.env.KIT, ...pathParts)

console.log({ kitPath: kitPath() })

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp(".npmrc", kitPath())
cp("package*.json", kitPath())
cp("pnpm-lock.yaml", kitPath())
cp("LICENSE", kitPath())

let { stdout: nodeVersion } = await exec("pnpm node --version")
console.log({ nodeVersion })
let { stdout: npmVersion } = await exec("pnpm --version")
console.log({ npmVersion })

console.log(`Building ESM to ${kitPath()}`)
try {
	await exec("pnpm install")
	let esm = await exec(`npx tsc --outDir ${kitPath()}`)
	console.log(esm)
} catch (e) {
	console.log(e)
	exit(1)
}

console.log(`Building declarations to ${kitPath()}`)
try {
	let dec = await exec(
		`npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
	)
	console.log(dec)
} catch (e) {
	console.log(e)
	exit(1)
}

console.log(`Building editor types to ${kitPath()}`)
try {
	let editorTypes = await exec("npx tsx ./build/build-editor-types.ts")
	console.log(editorTypes)
} catch (e) {
	console.log(e)
	exit(1)
}

console.log('Setting executable permissions for binary files...')
try {
	const { chmod } = await import('node:fs/promises')
	if (process.platform === 'win32') {
		console.log('Setting permissions for Windows batch files...')
		await chmod(kitPath('bin', 'kit.bat'), 0o755)
		console.log('Windows batch file permissions set successfully')
	} else {
		console.log('Setting executable permissions for Unix scripts...')
		await Promise.all([
			chmod(kitPath('script'), 0o755),
			chmod(kitPath('kar'), 0o755),
			chmod(kitPath('bin', 'k'), 0o755),
			chmod(kitPath('bin', 'kit'), 0o755),
			chmod(kitPath('bin', 'sk'), 0o755),
			chmod(kitPath('override', 'code', 'python'), 0o755)
		])
		console.log('Unix script permissions set successfully')
	}
} catch (e) {
	console.log('Error setting file permissions:', e)
	exit(1)
}

cd(kitPath())
