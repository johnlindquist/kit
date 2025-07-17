import fs from 'node:fs'
import { stat as statAsync, unlink } from 'node:fs/promises'
import { filesize } from 'filesize'
import * as ogPath from 'node:path'

import { formatDistanceToNow, compareAsc } from '../../utils/date.js'

import type { Dirent } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { PathConfig, PathDefaultMissingValues } from '../../types/kit'
import type { Action, AppState, Choice, PromptConfig } from '../../types'
import { Channel } from '../../core/enum.js'

const isWin = process.platform === 'win32'

/**
 * Convert a file-system path to the slash-only flavour that Script Kit's
 * UI (and drag-n-drop) expects. Keep the original form for disk I/O.
 */
const toUiPath = (p: string) => isWin ? p.replaceAll('\\', '/') : p

/**
 * Filter choices based on file types configuration
 * @param choices - Array of path choices
 * @param fileTypes - Array of allowed file extensions (e.g., ['.mp4', '.mp3'])
 * @returns Filtered choices including all directories and matching files
 */
const filterByFileTypes = (choices: Choice[], fileTypes: string[] | undefined): Choice[] => {
  if (!fileTypes) return choices
  
  return choices.filter((choice) => {
    // Always include directories (identified by folder.svg icon)
    if (choice.img?.includes('folder.svg')) {
      return true
    }
    
    // Check file extension
    const ext = ogPath.extname(choice.value)
    
    // Include files with matching extensions
    // Exclude files without extensions (like README, Makefile) when fileTypes is specified
    return ext && fileTypes.includes(ext)
  })
}

/**
 * Return all mount points (eg. ['C:\\', 'D:\\']) on Windows so that an
 * empty prompt can list "drives", similar to "/", "/home", etc. on POSIX.
 */
const getWindowsRoots = async (): Promise<string[]> => {
  if (!isWin) return []
  const drives: string[] = []
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  for (const letter of letters) {
    try {
      await fs.promises.stat(`${letter}:\\`)
      drives.push(`${letter}:\\`)
    } catch {
      // Drive doesn't exist, skip it
    }
  }

  return drives
}

export const createPathChoices = async (
  startPath: string,
  { dirFilter = (dirent) => true, dirSort = (a, b) => 0, onlyDirs = false, statFn = statAsync, fileTypes } : {
    dirFilter?: (dirent: any) => boolean
    dirSort?: (a: any, b: any) => number
    onlyDirs?: boolean
    statFn?: typeof statAsync
    fileTypes?: string[]
  } = {}
) => {
  // Special-case: on Windows an empty path means "show me the drives"
  if (isWin && (!startPath || ogPath.parse(startPath).root === startPath)) {
    const roots = await getWindowsRoots()
    return roots.map(drive => ({
      name: drive,
      value: drive,
      drag: drive,
      img: pathToFileURL(kitPath('icons', 'folder.svg')).href,
      description: '',
      mtime: new Date(),
      size: 0
    } as Choice))
  }

  const dirFiles = await readdir(startPath, {
    withFileTypes: true
  })

  dirFiles.sort((a, b) => {
    const aStarts = a.name.startsWith('.')
    const bStarts = b.name.startsWith('.')
    return aStarts === bStarts ? 0 : aStarts ? 1 : -1
  })

  const dirents = dirFiles.filter(dirFilter)
  const validDirents = []
  const statCache = new Map()

  const getCachedStat = async (path: string) => {
    if (!statCache.has(path)) {
      statCache.set(path, await statFn(path))
    }
    return statCache.get(path)
  }

  // Process symlinks in parallel
  await Promise.all(
    dirents.map(async (dirent) => {
      if (dirent.isSymbolicLink()) {
        try {
          const resolved = await fs.promises.realpath(ogPath.resolve(dirent.path as string, dirent.name))
          const stats = await getCachedStat(resolved)

          Object.assign(dirent, {
            path: ogPath.dirname(resolved),
            name: ogPath.basename(resolved),
            isDirectory: () => stats.isDirectory(),
            isFile: () => stats.isFile(),
            isSymbolicLink: () => stats.isSymbolicLink(),
            isBlockDevice: () => stats.isBlockDevice(),
            isCharacterDevice: () => stats.isCharacterDevice(),
            isFIFO: () => stats.isFIFO(),
            isSocket: () => stats.isSocket()
          })
          validDirents.push(dirent)
        } catch {
          // Skip invalid symlinks
        }
      } else {
        validDirents.push(dirent)
      }
    })
  )

  const folderSet = new Set(validDirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name))
  const folders = validDirents.filter((dirent) => folderSet.has(dirent.name))
  const files = onlyDirs ? [] : validDirents.filter((dirent) => !folderSet.has(dirent.name))

  const mapDirents = async (dirents: Dirent[]): Promise<Choice[]> => {
    const choices = await Promise.all(dirents.map(async (dirent) => {
      const fullPath = ogPath.resolve(dirent.path as string, dirent.name)
      const { size, mtime } = await getCachedStat(fullPath)

      const type = folderSet.has(dirent.name) ? 'folder' : 'file'
      const description = type === 'folder' ? '' : `${filesize(size)} - Last modified ${formatDistanceToNow(mtime)} ago`

      const img = pathToFileURL(kitPath('icons', `${type}.svg`)).href

      return {
        img,
        name: dirent.name,
        value: toUiPath(fullPath),
        description,
        drag: toUiPath(fullPath),
        mtime,
        size
      } as const
    }))
    return choices
  }

  const mapped = await mapDirents(folders.concat(files))
  const sorted = mapped.sort(dirSort)
  
  // Apply fileTypes filtering if specified
  return filterByFileTypes(sorted, fileTypes)
}

type DefaultMissingPathChoice = Omit<Choice, 'value'> & {
  value: PathDefaultMissingValues
  miss: true
}
let defaultPathMissingChoices: DefaultMissingPathChoice[] = [
  {
    name: "Doesn't exist, select anyway",
    miss: true,
    value: 'select-anyway',
    enter: 'Select'
  },
  {
    name: `Create Folder "{base}"`,
    miss: true,
    value: 'create-folder',
    enter: 'Create Folder'
  }
]

let __pathSelector = async (config: string | PathConfig = home(), actions?: Action[]) => {
  let startPath = ''
  let focusOn = ''
  let onInputHook = null
  let onlyDirs = false
  let missingChoices: Choice[] = defaultPathMissingChoices

  // Navigation history: Map of path -> last selected item name
  const navigationHistory = new Map<string, string>()

  // Handle string config (direct path)
  if (typeof config === 'string') {
    startPath = config
  }
  // Handle object config
  if (typeof config === 'object') {
    startPath = config?.startPath || home()
    onlyDirs = Boolean(config?.onlyDirs)
    let configMissingChoicesIsArray = Array.isArray(config?.missingChoices)
    missingChoices = configMissingChoicesIsArray
      ? config.missingChoices
      : config?.missingChoices || defaultPathMissingChoices
    if (!(onlyDirs || configMissingChoicesIsArray)) {
      const createFileChoice: DefaultMissingPathChoice = {
        name: `Create File "{base}"`,
        miss: true,
        value: 'create-file',
        enter: 'Create File'
      }
      missingChoices = [
        createFileChoice,

        ...missingChoices.slice(1)
      ]
    }
  }

  // ALWAYS normalize directory paths to have trailing separator
  // This ensures consistent behavior regardless of how the path utility is called
  if (startPath && (await pathExists(startPath))) {
    if ((await isDir(startPath)) && !startPath.endsWith(path.sep)) {
      startPath += path.sep
    }
  } else if (!startPath) {
    // Default to home directory with separator if no path provided
    startPath = home() + path.sep
  }

  let initialChoices = await createPathChoices(startPath, {
    onlyDirs,
    dirFilter: (dirent) => {
      // if (dirent.name.startsWith(".")) {
      //   return showHidden
      // }

      return true
    }
  })

  let currentDirChoices = async (startPath, dirFilter = () => true) => {
    try {
      let choices = await createPathChoices(startPath, {
        dirFilter: dirFilter as (dirent: any) => true,
        onlyDirs,
        fileTypes: (config as PathConfig)?.fileTypes
      })

      choices.push(...missingChoices)
      choices.push({
        name: '{input}',
        description: 'Select full path as typed',
        asTyped: true,
        value: 'select-anyway'
      });

      await setChoices(choices, {
        skipInitialSearch: false,
        inputRegex: `[^\\${path.sep}]+$`
      })
      setPauseResize(false)
      if (focusOn) {
        setFocused(focusOn)
      }
      focusOn = ''
    } catch (error) {
      setPanel(
        md(`### Failed to read ${startPath}
      
${error}      
      `)
      )
    }
  }

  let inputRegex = `[^\\${path.sep}]+$`
  setFilterInput(inputRegex)

  let slashCount = startPath.split(path.sep).length

  let lsCurrentDir = async (input) => {
    // if (!input) {
    //   await mainScript()
    // }

    if (input?.startsWith('~')) {
      startPath = home()
    }

    if (input?.endsWith(path.sep)) {
      startPath = input
    } else {
      startPath = path.dirname(input)
    }
    let isCurrentDir = await isDir(startPath)
    if (isCurrentDir) {
      await currentDirChoices(startPath)
    } else {
      setPanel(md(`### ${startPath} is not a path`))
    }
  }

  let upDir = async (dir) => {
    if (dir?.miss) {
      return
    }

    // Get the current path from the actual input state, not startPath
    // This ensures we're always working with the most current value
    const currentPath = global.__kitPromptState?.input || currentInput || startPath

    // Save the current selection in navigation history before going up
    if (dir?.name && currentPath) {
      navigationHistory.set(currentPath, dir.name)
    }

    // Remove trailing separator before getting parent, but not for root paths
    let cleanPath
    const rootPath = isWin ? ogPath.parse(currentPath).root : '/'

    if (currentPath === rootPath) {
      // Already at root, don't go up
      cleanPath = currentPath
    } else {
      // Remove trailing separator for dirname calculation
      cleanPath = currentPath.endsWith(path.sep)
        ? currentPath.slice(0, -1)
        : currentPath
    }

    const parentDir = path.dirname(cleanPath)

    // Handle root paths specially
    let newPath
    if (parentDir === cleanPath || parentDir === rootPath) {
      // We're at root
      newPath = rootPath
    } else {
      // For non-root paths, add separator and normalize
      newPath = path.normalize(parentDir + path.sep)
    }

    // Update startPath immediately to prevent race conditions
    startPath = newPath

    // Set the input
    await setInput(newPath)

    // Force refresh the directory listing with the new path
    await lsCurrentDir(newPath)

    // Check if we have a saved selection for the parent directory
    const savedSelection = navigationHistory.get(newPath)
    if (savedSelection) {
      focusOn = savedSelection
    } else if (dir) {
      // Default behavior: focus on the directory we came from
      focusOn = path.basename(cleanPath)
    }
  }

  let downDir = async (dir) => {
    if (dir?.miss) {
      return
    }

    // Get the current path from the actual input state, not startPath
    const currentPath = global.__kitPromptState?.input || currentInput || startPath

    let targetPath = typeof dir === 'string' ? ogPath.resolve(currentPath, dir) : dir.value
    let allowed = true
    let needsPermission =
      targetPath === home('Downloads') || targetPath === home('Documents') || targetPath === home('Desktop')

    if (needsPermission && isMac) {
      let testFile = createPathResolver(targetPath)(`._kit_test_file_${Date.now()}.txt`)
      await writeFile(testFile, `success`)
      allowed = await isFile(testFile)
      if (allowed) {
        global.log(`Access granted to ${targetPath}`)
        await unlink(testFile)
      }
    }

    if (allowed) {
      if (await isDir(targetPath)) {
        const newPath = targetPath + path.sep

        // Save current directory selection before navigating down
        if (dir?.name && currentPath) {
          navigationHistory.set(currentPath, dir.name)
        }

        // Update startPath immediately to prevent race conditions
        startPath = newPath

        await setInput(newPath)

        // Force refresh the directory listing
        await lsCurrentDir(newPath)

        // Check if we have a saved selection for this directory
        const savedSelection = navigationHistory.get(newPath)
        if (savedSelection) {
          focusOn = savedSelection
        }
      }
    } else {
      let html = md(`
## Unable to Access Folder

Kit needs permission to access \`${targetPath}\`. 

Please grant permission in System Preferences > Security & Privacy > Privacy > Files and Folders (or Full Disk Access).
`)

      await div({
        html,

        enter: 'Back to Main',
        shortcuts: [
          {
            name: 'Quit',
            key: `${cmd}+q`,
            bar: 'right',
            onPress: () => {
              send(Channel.QUIT_APP)
            }
          }
        ]
      })

      await mainScript()
    }
  }

  let currentInput = ''
  let prevInput = ''
  let onInput = async (input, state) => {
    let inputLess = input.length < prevInput.length
    prevInput = input
    currentInput = input
    setEnter((config as PathConfig)?.enter || 'Actions')
    if (onInputHook) {
      onInputHook(input, state)
    }
    // if (input.endsWith(">")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     compareAsc
    //   )
    //   setChoices(choices)
    //   return
    // }
    // if (input.endsWith("<")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     (a, b) => compareAsc(b, a)
    //   )
    //   setChoices(choices)
    //   return
    // }
    // if (input.endsWith(";")) {
    //   let choices = await createPathChoices(
    //     startPath,
    //     () => true,
    //     ()=> 0
    //   )
    //   setChoices(choices)
    //   return
    // }

    if (!input) {
      // Ensure we always have at least the root path
      const rootPath = isWin ? 'C:\\' : '/'
      setInput(rootPath)
      return
    }

    if (input?.startsWith('~')) {
      setInput(home() + path.sep)
      return
    }

    // if (input?.endsWith(path.sep + ".")) {
    //   let choices = await createPathChoices(startPath, {
    //     dirFilter: () => true,
    //     onlyDirs,
    //   })
    //   setChoices(choices, {
    //     skipInitialSearch: true,
    //     inputRegex: `[^\\${path.sep}]+$`,
    //   })
    //   if (focusOn) setFocused(focusOn)
    //   focusOn = ``
    //   return
    // }
    let currentSlashCount = input?.split(path.sep).length
    // Update lsCurrentDir trigger conditions to be more robust
    // - When slash count changes (navigating up/down)
    // - When input ends with separator (it's a directory)
    // - When we need to refresh the current directory listing
    if (currentSlashCount !== slashCount || input.endsWith(path.sep)) {
      slashCount = currentSlashCount
      await lsCurrentDir(input)
    }
  }

  let onTab = (input, state) => {
    if (state.modifiers.includes('shift')) {
      upDir(state.focused)
    } else {
      downDir(state.focused)
    }
  }

  let onRight = (input, state: AppState) => {
    if (!state.flaggedValue) {
      downDir(state.focused)
    }
  }

  let onLeft = (input, state) => {
    if (!state.flaggedValue) {
      upDir(state.focused)
    }
  }

  // Map FORWARD/BACK channels to right/left navigation
  let onForward = onRight
  let onBack = onLeft

  let sort = 'name'
  let dir = 'desc'
  let sorters = {
    date: ({ mtime: a }, { mtime: b }) => (dir === 'asc' ? compareAsc(a, b) : compareAsc(b, a)),
    name: ({ name: a }, { name: b }) => (dir === 'desc' ? (a > b ? 1 : -1) : a > b ? -1 : 1),
    size: ({ size: a }, { size: b }) => (dir === 'asc' ? (a > b ? 1 : -1) : a > b ? -1 : 1)
  }
  let createSorter = (s: 'date' | 'name' | 'size') => {
    return async () => {
      if (sort !== s) {
        dir = 'desc'
      } else {
        dir = dir === 'asc' ? 'desc' : 'asc'
      }

      sort = s
      let dirSort = sorters[s] as any
      let choices = await createPathChoices(startPath, {
        dirFilter: (dirent) => true,
        dirSort,
        onlyDirs,
        fileTypes: (config as PathConfig)?.fileTypes
      })

      setChoices(choices)
      setPauseResize(false)
    }
  }
  let bar = (config as PromptConfig)?.shortcuts?.length ? '' : ('right' as PromptConfig['shortcuts'][0]['bar'])
  setPauseResize(true)
  let selectedPath = await arg(
    {
      placeholder: 'Browse',
      ...(config as PromptConfig),
      inputCommandChars: ['/'],
      input: startPath,
      inputRegex: `[^\\${path.sep}]+$`,
      onInput,
      onTab,
      actions,

      alwaysOnTop: true,
      onRight,
      onLeft,
      onForward,
      onBack,
      // onNoChoices,
      // onEscape,
      // TODO: If I want resize, I need to create choices first?
      onInit: () => {
        setResize(true)
        lsCurrentDir(startPath)
      },
      shortcuts: [
        {
          name: 'Out',
          key: 'left',
          bar,
          onPress: onLeft
        },
        {
          name: 'In',
          key: 'right',
          bar,
          onPress: onRight
        },
        {
          name: 'Name',
          key: `${cmd}+,`,
          onPress: createSorter('name'),
          visible: true,
          bar
        },
        {
          name: 'Size',
          key: `${cmd}+.`,
          onPress: createSorter('size'),
          visible: true,
          bar
        },
        {
          name: 'Date',
          visible: true,
          key: `${cmd}+/`,
          onPress: createSorter('date'),
          bar
        },
        ...((config as PromptConfig).shortcuts || [])
      ]
    },
    initialChoices
  )

  if (!selectedPath) {
    return ''
  }
  if (selectedPath === 'create-file') {
    selectedPath = currentInput
    let doesPathExist = await pathExists(selectedPath)
    if (!doesPathExist) {
      await ensureFile(selectedPath)
    }
  }

  if (selectedPath === 'create-folder') {
    selectedPath = currentInput
    let doesPathExist = await pathExists(selectedPath)
    if (!doesPathExist) {
      await ensureDir(selectedPath)
    }
  }

  if (selectedPath === 'select-anyway') {
    selectedPath = currentInput
  }

  return selectedPath.trim()
}

global.path = new Proxy(__pathSelector, {
  get: (target, k: string) => {
    if (k === 'then') return __pathSelector
    return ogPath[k]
  }
}) as any

export const path = global.path