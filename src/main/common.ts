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
        enter: 'Copy',
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
        startPath: path.dirname(selectedFile),
        onlyDirs: false,
        enter: 'Duplicate',
        shortcuts: [escapeShortcut],
        missingChoices: [
          {
            name: `Duplicate "{base}" to "{input}"`,
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
        onlyDirs: true,
        enter: 'Move'
      })
      mv(selectedFile, destFolder)
    }
  },
  {
    name: "Move and Rename",
    value: "move-and-rename",
    shortcut: `${cmd}+shift+m`,
    action: async (selectedFile) => {
      const baseName = path.basename(selectedFile);
      const dirName = path.dirname(selectedFile);

      await path({
        startPath: dirName,
        hint: `Enter new path/name for "${baseName}"`,
        enter: 'Move & Rename',
        onSubmit: async (selectedPath) => {
          // Ensure parent directory exists before moving
          await editor(selectedPath);
          await ensureDir(path.dirname(selectedPath));
          // Perform the move
          await mv(selectedFile, selectedPath);
        }
      });
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
    name: 'Copy as File Reference',
    value: 'copy-as-file-reference',
    shortcut: `${cmd}+shift+c`,
    action: async (selectedFile) => {
      await clipboard.writeBuffer('public.file-url', Buffer.from(`file://${encodeURI(selectedFile)}`, 'utf8'))
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
    const SYSTEM_APP_DIR = '/System/Applications'
    const SYSTEM_UTILITIES_DIR = '/System/Applications/Utilities'
    const CHROME_APPS_DIR = home('Applications', 'Chrome Apps.localized')

    // Helper to safely read directories, returning empty array if directory doesn't exist
    const safeReaddir = async (dirPath: string): Promise<string[]> => {
      try {
        if (await isDir(dirPath)) {
          return (await readdir(dirPath)).map((app) => `${dirPath}/${app}`)
        }
        return []
      } catch (error) {
        global.warn?.(`Could not read directory ${dirPath}: ${error.message}`)
        return []
      }
    }

    let manualAppDir = await safeReaddir(APP_DIR)
    let manualUtilitiesDir = await safeReaddir(UTILITIES_DIR)
    let systemAppDir = await safeReaddir(SYSTEM_APP_DIR)
    let systemUtilitiesDir = await safeReaddir(SYSTEM_UTILITIES_DIR)
    let chromeApps = await safeReaddir(CHROME_APPS_DIR)

    let apps = manualAppDir
      .concat(chromeApps, manualUtilitiesDir, systemAppDir, systemUtilitiesDir)
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
