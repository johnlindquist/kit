import { pathToFileURL } from 'node:url'
import { escapeShortcut, isMac, isWin, cmd, sortBy, uniq } from '../core/utils.js'
import { MainMenuType } from '../core/enum.js'
import { createPathChoices } from '../target/path/path.js'

type ActionFlag = {
  name: string
  shortcut?: string
  description?: string
  value: string
  action?: (selectedFile: string) => Promise<unknown>
}

let openConfigPath = kenvPath('config', 'open.json')
let openActions: ActionFlag[] = []
if (await isFile(openConfigPath)) {
  let openConfig = await readJson(openConfigPath)
  for (let item of openConfig) {
    openActions.push({
      name: item.name,
      value: item.name,
      shortcut: item?.shortcut || '',
      action: async (selectedFile: string) => {
        hide()
        await exec(item.command.replace('${file}', `'${selectedFile}'`))
        process.exit(0)
      }
    })
  }
}

export let actionFlags: ActionFlag[] = [
  {
    name: 'Open in Default App',
    value: 'open',
    action: async (selectedFile) => {
      await open(selectedFile)
    }
  },
  ...openActions,
  {
    name: 'Open with...',
    description: 'Select from a list of apps to open the file with',
    value: 'open-with',
    action: async (selectedFile) => {
      await run(kitPath('main', 'open-with.js'), selectedFile)
    }
  },
  {
    name: `Show in ${isMac ? 'Finder' : 'Explorer'}`,
    shortcut: `${cmd}+f`,
    description: `Reveal the file in ${isMac ? 'Finder' : 'Explorer'}`,
    value: 'finder',
    action: async (selectedFile) => {
      await revealFile(selectedFile)
    }
  },
  ...(isMac
    ? [
      {
        name: 'Show Info',
        value: 'info',
        shortcut: `${cmd}+i`,
        action: async (selectedFile) => {
          await applescript(`
  set aFile to (POSIX file "${selectedFile}") as alias
  tell application "Finder" to open information window of aFile
  `)
        }
      }
    ]
    : []),
  {
    name: 'Open Path in Kit Term',
    value: 'kit-term',
    action: async (selectedFile) => {
      await term({
        command: `cd ${selectedFile}`,
        description: selectedFile,
        name: 'Kit Term'
      })
    }
  },
  {
    name: 'Open in Terminal',
    value: 'terminal',
    shortcut: `${cmd}+t`,
    action: async (selectedFile) => {
      hide()
      let isSelectedFileAFile = await isFile(selectedFile)
      if (isSelectedFileAFile) {
        selectedFile = path.dirname(selectedFile)
      }
      if (isWin) {
        return await exec(`start cmd /k "cd ${selectedFile}"`)
      }

      if (isMac) {
        if (env?.KIT_TERMINAL?.toLowerCase() === 'iterm') {
          return await exec(`open -a iTerm '${selectedFile}'`)
        }
        return await exec(`open -a Terminal '${selectedFile}'`)
      }

      // Linux support
      return await exec(`x-terminal-emulator -e "cd '${selectedFile}' && $SHELL"`)
    }
  },
  {
    name: 'Open in Kit Editor',
    value: 'editor',
    action: async (selectedFile) => {
      try {
        let content = await readFile(selectedFile, 'utf-8')
        content = await editor(content)
        await writeFile(selectedFile, content)
      } catch (error) {
        console.log(`Error: ${error}`)
      }
    }
  },
  {
    name: 'Open in VS Code',
    value: 'vscode',
    shortcut: `${cmd}+shift+v`,
    action: async (selectedFile) => {
      hide()
      if (isMac) {
        await exec(`open -a 'Visual Studio Code' '${selectedFile}'`)
      } else {
        await exec(`code ${selectedFile}`)
      }
    }
  },
  ...(process.env?.KIT_OPEN_IN
    ? [
      {
        name: `Open with ${process.env.KIT_OPEN_IN}`,
        value: 'open_in_custom',
        action: async (selectedFile) => {
          hide()
          if (isMac) {
            let command = `${process.env.KIT_OPEN_IN} '${selectedFile}'`
            await exec(command)
          } else {
            await exec(`"${process.env.KIT_OPEN_IN}" '${selectedFile}'`)
          }
        }
      }
    ]
    : []),
  {
    name: 'Copy to...',
    value: 'copy_to',
    shortcut: `${cmd}+shift+c`,
    action: async (selectedFile) => {
      let destination = await path({
        hint: `Select destination for ${path.basename(selectedFile)}`,
        startPath: home(),
        onlyDirs: true,
        shortcuts: [escapeShortcut]
      })
      await copyFile(selectedFile, path.resolve(destination, path.basename(selectedFile)))
    }
  },
  {
    name: 'Duplicate',
    value: 'duplicate',
    shortcut: `${cmd}+shift+d`,
    action: async (selectedFile) => {
      const base = path.basename(selectedFile)
      let destination = await path({
        hint: `Select path (including new filename) for ${base}`,
        startPath: home(),
        onlyDirs: true,
        shortcuts: [escapeShortcut],
        missingChoices: [
          {
            name: `Duplicate "${base}" to "{input}"`,
            miss: true,
            enter: 'Duplicate',
            onSubmit: (input) => {
              submit(input)
            }
          }
        ]
      })

      await copyFile(selectedFile, path.resolve(destination))
    }
  },
  {
    name: 'Rename',
    value: 'rename',
    shortcut: `${cmd}+r`,
    action: async (selectedFile) => {
      let newName = await arg({
        hint: `Rename ${path.basename(selectedFile)} to:`
      })
      mv(selectedFile, path.resolve(path.dirname(selectedFile), newName))
    }
  },
  {
    name: 'Move',
    value: 'move',
    shortcut: `${cmd}+m`,
    action: async (selectedFile) => {
      let destFolder = await path({
        startPath: path.dirname(selectedFile),
        hint: `Select destination for ${path.basename(selectedFile)}`,
        onlyDirs: true
      })
      mv(selectedFile, destFolder)
    }
  },
  {
    name: "Move and Rename",
    value: "move-and-rename",
    shortcut: `${cmd}+shift+m`,
    action: async (selectedFile) => {
      const baseName = path.basename(selectedFile)
      const dirName = path.dirname(selectedFile)
      
      // Track whether we're in "create mode"
      let createMode = false
      let lastValidDir = dirName
      
      let newPath = await path({
        startPath: dirName,
        hint: `Enter new path/name for "${baseName}"`,
        enter: 'Move & Rename',
        
        // Override the default onInput behavior
        onInput: async (input, state) => {
          if (!input) return
          
          // Handle home directory expansion
          if (input.startsWith('~')) {
            input = home() + input.slice(1)
            await setInput(input)
            return
          }
          
          // Extract directory and filename parts
          const inputDir = input.endsWith(path.sep) ? input : path.dirname(input)
          const inputName = input.endsWith(path.sep) ? '' : path.basename(input)
          
          // Check if the directory exists
          const dirExists = await isDir(inputDir)
          
          if (dirExists && inputDir !== lastValidDir) {
            // Directory exists and changed - load its contents
            lastValidDir = inputDir
            createMode = false
            
            // Load directory contents
            const choices = await createPathChoices(inputDir, { onlyDirs: false })
            
            // Add the "create new file" option if user typed a filename
            if (inputName) {
              choices.unshift({
                name: `Create: "${inputName}"`,
                value: input,
                description: 'New file will be created',
                enter: 'Create & Move',
                miss: true,
                img: pathToFileURL(kitPath('icons', 'file.svg')).href
              })
            }
            
            await setChoices(choices)
            setPanel('')  // Clear any previous messages
            
          } else if (!dirExists && !createMode) {
            // Directory doesn't exist - enter create mode
            createMode = true
            
            // Show helpful message instead of error
            setPanel(md(`### New path will be created
          
**Directory:** ${inputDir}
**File:** ${inputName || 'Enter filename...'}

Press **Enter** to create and move the file.`))
            
            // Set choices to just the create option
            await setChoices([{
              name: `Create path: "${input}"`,
              value: input,
              description: 'This path will be created',
              enter: 'Create & Move',
              miss: true,
              img: pathToFileURL(kitPath('icons', 'folder.svg')).href
            }])
            
          } else if (createMode && inputName) {
            // Update the create option with current input
            await setChoices([{
              name: `Create path: "${input}"`,
              value: input,
              description: 'This path will be created',
              enter: 'Create & Move',
              miss: true,
              img: pathToFileURL(kitPath('icons', 'file.svg')).href
            }])
            
            // Update the panel with current path info
            setPanel(md(`### New path will be created
          
**Directory:** ${inputDir}
**File:** ${inputName}

Press **Enter** to create and move the file.`))
          }
          
          // Update enter button text based on mode
          setEnter(createMode ? 'Create & Move' : 'Select')
        },
        
        // Don't use the default missingChoices
        missingChoices: [],
        
        // Custom shortcuts
        shortcuts: [
          escapeShortcut,
          {
            name: 'Parent Dir',
            key: `${cmd}+up`,
            onPress: async (input) => {
              const parentDir = path.dirname(path.dirname(input))
              await setInput(parentDir + path.sep)
            }
          }
        ]
      })

      if (newPath) {
        // Ensure parent directory exists before moving
        const newDir = path.dirname(newPath)
        if (!(await isDir(newDir))) {
          await ensureDir(newDir)
        }
        
        // Perform the move
        await mv(selectedFile, newPath)
      }
    }
  },
  {
    name: 'Copy Path',
    value: 'copy',
    shortcut: `${cmd}+c`,
    action: async (selectedFile) => {
      await copy(selectedFile)
    }
  },
  {
    name: 'Paste Path',
    value: 'paste',
    shortcut: `${cmd}+v`,
    action: async (selectedFile) => {
      await setSelectedText(selectedFile)
    }
  },
  {
    name: 'Trash',
    value: 'trash',
    action: async (selectedFile) => {
      let yn = await arg({
        placeholder: `Trash ${path.basename(selectedFile)}?`,
        hint: '[y]/[n]'
      })
      if (yn === 'y') {
        await trash(selectedFile)
      }
    }
  }
]

export let findApps = async (includePrefs = false) => {
  if (process.platform === 'darwin') {
    const isBrokenSymlink = async (filePath: string) => {
      try {
        await realpath(filePath)
        return false
      } catch {
        return true
      }
    }

    let foundApps = await fileSearch('', {
      onlyin: '/',
      kMDItemContentType: 'com.apple.application-bundle'
    })
    const APP_DIR = '/Applications'
    const UTILITIES_DIR = `${APP_DIR}/Utilities`
    const SYSTEM_UTILITIES_DIR = '/System/Applications/Utilities'
    const CHROME_APPS_DIR = home('Applications', 'Chrome Apps.localized')

    let manualAppDir = (await readdir(APP_DIR)).map((app) => `${APP_DIR}/${app}`)
    let manualUtilitiesDir = (await readdir(UTILITIES_DIR)).map((app) => `${UTILITIES_DIR}/${app}`)
    let systemUtilitiesDir = (await readdir(SYSTEM_UTILITIES_DIR)).map((app) => `${SYSTEM_UTILITIES_DIR}/${app}`)
    let chromeApps = []
    if (await isDir(CHROME_APPS_DIR)) {
      chromeApps = (await readdir(CHROME_APPS_DIR)).map((app) => `${CHROME_APPS_DIR}/${app}`)
    }

    let apps = manualAppDir
      .concat(chromeApps, manualUtilitiesDir, systemUtilitiesDir)
      .filter((app) => app.endsWith('.app'))

    // Filter out broken symlinks
    apps = (
      await Promise.all(
        apps.map(async (app) => {
          if (await isBrokenSymlink(app)) {
            return null
          }
          return app
        })
      )
    ).filter((app): app is string => app !== null)

    for (let a of foundApps) {
      let base = path.basename(a)
      let same = apps.find((app) => path.basename(app) === base)
      if (!same) {
        apps.push(a)
      }
    }

    // apps = uniq(apps.filter(a => !a.includes("Users")))
    let prefs = []
    if (includePrefs) {
      prefs = await fileSearch('', {
        onlyin: '/',
        kind: 'preferences'
      })
    }
    return {
      apps,
      prefs
    }
  }
  if (process.platform === 'win32') {
    let globalApps = await fileSearch('', {
      onlyin: '"%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs"',
      kind: 'application'
    })
    let apps = await fileSearch('', {
      onlyin: '"%AppData%\\Microsoft\\Windows\\Start Menu\\Programs"',
      kind: 'application'
    })
    return {
      apps: [...globalApps, ...apps],
      prefs: []
    }
  }
}

export let createAppChoices = async () => {
  let extractIcon =
    // @ts-ignore
    process.platform === 'win32' ? (await import('get-app-icon')).extractIcon : () => Promise.resolve(undefined)
  setLoading(true)
  let { apps, prefs } = await findApps(true)
  let allApps = uniq(apps.concat(prefs)).filter((appPath) => {
    if (appPath.includes('/opt/')) return false
    if (appPath.includes('/Updater.app')) return false
    if (appPath.includes('(Parallels)')) return false
    if (appPath.includes('/Contents/')) return false
    if (appPath.includes('/Uninstall')) return false
    if (appPath.includes('/PrivateFrameworks')) return false
    if (appPath.includes('Daemon Containers')) return false

    return true
  })

  let assetsPath = kitPath('assets', 'app-launcher', 'icons')
  await ensureDir(assetsPath)

  // Process icons in parallel batches
  const BATCH_SIZE = 10 // Increased batch size for parallel processing
  const CONCURRENT_BATCHES = 3 // Number of batches to process simultaneously

  if (process.platform === 'darwin') {
    let { fileIconToFile } = await import('file-icon')

    let destination = allApps.map((appPath) => {
      let { base: appName } = path.parse(appPath)
      return path.resolve(assetsPath, `${appName}.png`)
    })

    global.log(`Creating icons for ${allApps.length} apps\n`)

    // Process multiple batches concurrently
    for (let i = 0; i < allApps.length; i += BATCH_SIZE * CONCURRENT_BATCHES) {
      const batchPromises = []

      for (let j = 0; j < CONCURRENT_BATCHES; j++) {
        const startIdx = i + j * BATCH_SIZE
        const batch = allApps.slice(startIdx, startIdx + BATCH_SIZE)
        const batchDestination = destination.slice(startIdx, startIdx + BATCH_SIZE)

        if (batch.length > 0) {
          batchPromises.push(
            fileIconToFile(batch, {
              size: 48,
              destination: batchDestination
            })
          )
        }
      }

      await Promise.all(batchPromises)
      global.log(
        `\rProcessed ${Math.min(i + BATCH_SIZE * CONCURRENT_BATCHES, allApps.length)} out of ${allApps.length} icons`
      )
    }

    global.log('\rDone creating icons\n')
  }

  if (isWin) {
    global.log(`Creating icons for ${allApps.length} apps\n`)

    // Process multiple batches concurrently for Windows
    for (let i = 0; i < allApps.length; i += BATCH_SIZE * CONCURRENT_BATCHES) {
      const batchPromises = []

      for (let j = 0; j < CONCURRENT_BATCHES; j++) {
        const startIdx = i + j * BATCH_SIZE
        const batch = allApps.slice(startIdx, startIdx + BATCH_SIZE)

        if (batch.length > 0) {
          batchPromises.push(
            Promise.all(
              batch.map(async (appPath) => {
                try {
                  let { base: appName } = path.parse(appPath)
                  let img = path.resolve(assetsPath, `${appName}.png`)

                  let data = await extractIcon(appPath.trim()).catch(() => undefined)
                  if (data) {
                    let buff = Buffer.from(data.replace(/^data:image\/png;base64,/, ''), 'base64')
                    await ensureDir(path.dirname(img))
                    await writeFile(img, buff)
                  }
                } catch (error) {
                  // Silently ignore errors for individual icons
                }
              })
            )
          )
        }
      }

      await Promise.all(batchPromises)
      global.log(
        `\rProcessed ${Math.min(i + BATCH_SIZE * CONCURRENT_BATCHES, allApps.length)} out of ${allApps.length} icons`
      )
    }

    global.log('\rDone creating icons\n')
  }

  // Process choices creation in parallel
  const choices = await Promise.all(
    allApps.map(async (appPath) => {
      let { base: appName } = path.parse(appPath)
      let img = path.resolve(assetsPath, `${appName}.png`)
      let value = appPath.replace(/\r?\n?$/i, '')

      return {
        id: value,
        name: appName.replace(/\.(app|lnk|url)\s*$/i, ''),
        value,
        description: appPath.replace(/\r?\n?$/i, ''),
        img: pathToFileURL(img).href,
        enter: `Open`,
        type: MainMenuType.APP
      }
    })
  )

  return sortBy(choices, ['value', 'name'])
}
