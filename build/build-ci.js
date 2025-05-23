import { exit } from "node:process"
import shelljs from "shelljs"
import { execaCommand as exec } from "execa"
import path from "node:path"
import { existsSync, statSync } from "node:fs"

let { cd, cp, ls } = shelljs

let kitPath = (...pathParts) => path.resolve(process.env.KIT, ...pathParts)

console.log('=== CI BUILD DIAGNOSTICS START ===')
console.log('Platform:', process.platform)
console.log('Node version:', process.version)
console.log('Process argv:', process.argv)
console.log('Current working directory:', process.cwd())
console.log('Environment KIT variable:', process.env.KIT)
console.log('Resolved kitPath:', kitPath())
console.log('Source root exists:', existsSync('./root'))
console.log('Source root/bin exists:', existsSync('./root/bin'))

if (existsSync('./root/bin')) {
  console.log('Source bin directory contents:')
  const binContents = ls('./root/bin')
  binContents.forEach(file => {
    const filePath = `./root/bin/${file}`
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      console.log(`  ${file}: size=${stats.size}, mode=${stats.mode.toString(8)}, executable=${!!(stats.mode & 0o111)}`)
    }
  })
}

console.log('\n=== COPYING FILES ===')
console.log('Copying ./root/. to', kitPath())
cp("-R", "./root/.", kitPath())

console.log('Copying ./build to', kitPath())
cp("-R", "./build", kitPath())

console.log('Copying ./src/types to', kitPath())
cp("-R", "./src/types", kitPath())

console.log('Copying additional files...')
cp("*.md", kitPath())
cp(".npmrc", kitPath())
cp("package*.json", kitPath())
cp("pnpm-lock.yaml", kitPath())
cp("LICENSE", kitPath())

console.log('\n=== VERIFYING COPIED FILES ===')
console.log('Kit directory exists:', existsSync(kitPath()))
console.log('Kit bin directory exists:', existsSync(kitPath('bin')))

if (existsSync(kitPath('bin'))) {
  console.log('Copied bin directory contents:')
  const copiedBinContents = ls(kitPath('bin'))
  copiedBinContents.forEach(file => {
    const filePath = kitPath('bin', file)
    if (existsSync(filePath)) {
      const stats = statSync(filePath)
      console.log(`  ${file}: size=${stats.size}, mode=${stats.mode.toString(8)}, executable=${!!(stats.mode & 0o111)}`)
    }
  })
} else {
  console.log('❌ ERROR: bin directory was not copied!')
}

// Check other important files
const importantFiles = ['script', 'kar', 'package.json', 'index.js']
importantFiles.forEach(file => {
  const filePath = kitPath(file)
  console.log(`${file} exists:`, existsSync(filePath))
  if (existsSync(filePath)) {
    const stats = statSync(filePath)
    console.log(`  ${file}: size=${stats.size}, mode=${stats.mode.toString(8)}`)
  }
})

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

console.log('\n=== SETTING FILE PERMISSIONS ===')
console.log('Platform detected:', process.platform)

try {
	const { chmod } = await import('node:fs/promises')
	
	if (process.platform === 'win32') {
		console.log('Setting permissions for Windows batch files...')
		const batFile = kitPath('bin', 'kit.bat')
		console.log('Windows batch file path:', batFile)
		console.log('Windows batch file exists:', existsSync(batFile))
		
		if (existsSync(batFile)) {
			const beforeStats = statSync(batFile)
			console.log('Before chmod - mode:', beforeStats.mode.toString(8))
			
			await chmod(batFile, 0o755)
			
			const afterStats = statSync(batFile)
			console.log('After chmod - mode:', afterStats.mode.toString(8))
			console.log('Windows batch file permissions set successfully')
		} else {
			console.log('❌ ERROR: kit.bat file not found!')
		}
	} else {
		console.log('Setting executable permissions for Unix scripts...')
		
		const unixFiles = [
			{ path: kitPath('script'), name: 'script' },
			{ path: kitPath('kar'), name: 'kar' },
			{ path: kitPath('bin', 'k'), name: 'bin/k' },
			{ path: kitPath('bin', 'kit'), name: 'bin/kit' },
			{ path: kitPath('bin', 'sk'), name: 'bin/sk' },
			{ path: kitPath('override', 'code', 'python'), name: 'override/code/python' }
		]
		
		for (const file of unixFiles) {
			console.log(`\nProcessing ${file.name}:`)
			console.log(`  Path: ${file.path}`)
			console.log(`  Exists: ${existsSync(file.path)}`)
			
			if (existsSync(file.path)) {
				const beforeStats = statSync(file.path)
				console.log(`  Before chmod - mode: ${beforeStats.mode.toString(8)}, executable: ${!!(beforeStats.mode & 0o111)}`)
				
				await chmod(file.path, 0o755)
				
				const afterStats = statSync(file.path)
				console.log(`  After chmod - mode: ${afterStats.mode.toString(8)}, executable: ${!!(afterStats.mode & 0o111)}`)
			} else {
				console.log(`  ❌ WARNING: ${file.name} not found, skipping...`)
			}
		}
		
		console.log('Unix script permissions processing completed')
	}
} catch (e) {
	console.log('❌ ERROR setting file permissions:', e)
	console.log('Error details:', e.message)
	console.log('Error stack:', e.stack)
	exit(1)
}

console.log('\n=== FINAL VERIFICATION ===')
console.log('Final kit directory:', kitPath())
console.log('Kit directory exists:', existsSync(kitPath()))

if (existsSync(kitPath())) {
  console.log('Kit directory contents:')
  const kitContents = ls(kitPath())
  console.log('  Directories and files:', kitContents.length, 'items')
  
  // Check bin directory final state
  if (existsSync(kitPath('bin'))) {
    console.log('\nFinal bin directory state:')
    const finalBinContents = ls(kitPath('bin'))
    finalBinContents.forEach(file => {
      const filePath = kitPath('bin', file)
      if (existsSync(filePath)) {
        const stats = statSync(filePath)
        const isExecutable = !!(stats.mode & 0o111)
        const status = isExecutable ? '✅' : '❌'
        console.log(`  ${status} ${file}: mode=${stats.mode.toString(8)}, executable=${isExecutable}, size=${stats.size}`)
      }
    })
  } else {
    console.log('❌ CRITICAL ERROR: bin directory missing in final build!')
  }
  
  // Check package.json
  const packageJsonPath = kitPath('package.json')
  if (existsSync(packageJsonPath)) {
    console.log('\n✅ package.json exists')
    try {
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'))
      console.log('  Package name:', packageJson.name)
      console.log('  Package version:', packageJson.version)
      console.log('  Binary entries:', Object.keys(packageJson.bin || {}))
    } catch (e) {
      console.log('❌ Error reading package.json:', e.message)
    }
  } else {
    console.log('❌ CRITICAL ERROR: package.json missing!')
  }
  
  // Check other critical files
  const criticalFiles = ['index.js', 'script', 'kar']
  criticalFiles.forEach(file => {
    const filePath = kitPath(file)
    const exists = existsSync(filePath)
    const status = exists ? '✅' : '❌'
    console.log(`${status} ${file}: ${exists ? 'exists' : 'MISSING'}`)
    if (exists) {
      const stats = statSync(filePath)
      console.log(`    Size: ${stats.size}, Mode: ${stats.mode.toString(8)}`)
    }
  })
}

console.log('\n=== BUILD SUMMARY ===')
console.log('Build completed at:', new Date().toISOString())
console.log('Kit output directory:', kitPath())
console.log('Ready to change directory to kit path...')

cd(kitPath())

console.log('\n=== POST-CD VERIFICATION ===')
console.log('Current working directory after cd:', process.cwd())
console.log('Expected directory:', kitPath())
console.log('Directories match:', process.cwd() === kitPath())

// Final test - try to check if kit binary would be accessible
if (process.platform !== 'win32') {
  const kitBin = path.resolve('./bin/kit')
  console.log('Kit binary path (relative):', kitBin)
  console.log('Kit binary exists:', existsSync(kitBin))
  if (existsSync(kitBin)) {
    const stats = statSync(kitBin)
    console.log('Kit binary executable:', !!(stats.mode & 0o111))
    console.log('Kit binary mode:', stats.mode.toString(8))
  }
}

console.log('\n=== CI BUILD DIAGNOSTICS END ===')
console.log('If you see this message, the build completed successfully!')
console.log('Timestamp:', new Date().toISOString())
