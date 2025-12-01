import fs from 'node:fs'
import { stat as statAsync, unlink } from 'node:fs/promises'
import { filesize } from 'filesize'
import * as ogPath from 'node:path'

import { formatDistanceToNow, compareAsc } from '../../utils/date.js'

import type { Dirent, Stats } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { PathConfig, PathDefaultMissingValues } from '../../types/kit'
import type { Action, AppState, Choice, PromptConfig } from '../../types'
import { Channel } from '../../core/enum.js'

const isWin = process.platform === 'win32'

// ============================================================================
// Path Browser Enhancements
// ============================================================================

/**
 * Structured error codes for path operations
 */
export const PathErrorCode = {
  PERMISSION_DENIED: 'EACCES',
  NOT_FOUND: 'ENOENT',
  NOT_A_DIRECTORY: 'ENOTDIR',
  SYMLINK_LOOP: 'ELOOP',
  TOO_MANY_FILES: 'EMFILE',
  NETWORK_UNREACHABLE: 'ENETUNREACH',
  UNKNOWN: 'UNKNOWN'
} as const

export type PathErrorCode = typeof PathErrorCode[keyof typeof PathErrorCode]

/**
 * Enhanced error class for path operations with structured error codes
 */
export class PathError extends Error {
  code: PathErrorCode
  path: string
  hint?: string

  constructor(message: string, code: PathErrorCode, path: string, hint?: string) {
    super(message)
    this.name = 'PathError'
    this.code = code
    this.path = path
    this.hint = hint
  }

  static fromNodeError(err: NodeJS.ErrnoException, path: string): PathError {
    const codeMap: Record<string, PathErrorCode> = {
      EACCES: PathErrorCode.PERMISSION_DENIED,
      EPERM: PathErrorCode.PERMISSION_DENIED,
      ENOENT: PathErrorCode.NOT_FOUND,
      ENOTDIR: PathErrorCode.NOT_A_DIRECTORY,
      ELOOP: PathErrorCode.SYMLINK_LOOP,
      EMFILE: PathErrorCode.TOO_MANY_FILES,
      ENETUNREACH: PathErrorCode.NETWORK_UNREACHABLE
    }
    const code = codeMap[err.code || ''] || PathErrorCode.UNKNOWN
    const hints: Record<PathErrorCode, string> = {
      [PathErrorCode.PERMISSION_DENIED]: 'Check file permissions or grant access in System Preferences > Security & Privacy',
      [PathErrorCode.NOT_FOUND]: 'The path does not exist. Check for typos or create it first.',
      [PathErrorCode.NOT_A_DIRECTORY]: 'Expected a directory but found a file.',
      [PathErrorCode.SYMLINK_LOOP]: 'Circular symlink detected. Check symlink targets.',
      [PathErrorCode.TOO_MANY_FILES]: 'Too many open files. Close some applications or increase ulimit.',
      [PathErrorCode.NETWORK_UNREACHABLE]: 'Network path is unreachable. Check network connection.',
      [PathErrorCode.UNKNOWN]: 'An unexpected error occurred.'
    }
    return new PathError(err.message, code, path, hints[code])
  }
}

/**
 * Simple LRU cache for fs.stat results to improve performance
 * Reduces disk I/O when navigating directories with many files
 */
class StatCache {
  private cache = new Map<string, { stats: Stats; timestamp: number }>()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize = 1000, ttlMs = 30000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  async get(path: string, statFn: typeof statAsync = statAsync): Promise<Stats> {
    const now = Date.now()
    const cached = this.cache.get(path)

    if (cached && (now - cached.timestamp) < this.ttlMs) {
      // Move to end for LRU behavior
      this.cache.delete(path)
      this.cache.set(path, cached)
      return cached.stats
    }

    // Fetch fresh stats
    const stats = await statFn(path)

    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(path, { stats, timestamp: now })
    return stats
  }

  invalidate(path: string): void {
    this.cache.delete(path)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

// Session-level stat cache shared across path selector invocations
const sessionStatCache = new StatCache()

/**
 * Track recently visited folders for quick access
 */
class RecentFolders {
  private folders: string[] = []
  private maxSize: number

  constructor(maxSize = 10) {
    this.maxSize = maxSize
  }

  add(folder: string): void {
    // Remove if already exists
    const index = this.folders.indexOf(folder)
    if (index > -1) {
      this.folders.splice(index, 1)
    }
    // Add to front
    this.folders.unshift(folder)
    // Trim to max size
    if (this.folders.length > this.maxSize) {
      this.folders = this.folders.slice(0, this.maxSize)
    }
  }

  getAll(): string[] {
    return [...this.folders]
  }

  clear(): void {
    this.folders = []
  }
}

// Global recent folders tracker
const recentFolders = new RecentFolders()

/**
 * Debug timing utilities for path operations
 */
const pathDebug = {
  enabled: false,
  timings: new Map<string, number[]>(),

  enable(): void {
    this.enabled = true
  },

  disable(): void {
    this.enabled = false
  },

  time<T>(label: string, fn: () => T): T {
    if (!this.enabled) return fn()
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    this.recordTiming(label, duration)
    return result
  },

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn()
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    this.recordTiming(label, duration)
    return result
  },

  recordTiming(label: string, durationMs: number): void {
    if (!this.timings.has(label)) {
      this.timings.set(label, [])
    }
    this.timings.get(label)!.push(durationMs)
    global.log?.(`[path-debug] ${label}: ${durationMs.toFixed(2)}ms`)
  },

  getStats(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const stats: Record<string, { count: number; avg: number; min: number; max: number }> = {}
    for (const [label, times] of this.timings) {
      stats[label] = {
        count: times.length,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times)
      }
    }
    return stats
  },

  clearStats(): void {
    this.timings.clear()
  }
}

// Export debug utilities for external use
export { sessionStatCache, recentFolders, pathDebug }

/**
 * Detect symlink loops by tracking visited inodes
 */
const detectSymlinkLoop = async (
  linkPath: string,
  visited: Set<string> = new Set()
): Promise<{ isLoop: boolean; target?: string }> => {
  try {
    const realPath = await fs.promises.realpath(linkPath)

    // Check if we've seen this real path before
    if (visited.has(realPath)) {
      return { isLoop: true, target: realPath }
    }

    visited.add(realPath)

    // Check if target is also a symlink
    const targetStat = await fs.promises.lstat(realPath)
    if (targetStat.isSymbolicLink()) {
      return detectSymlinkLoop(realPath, visited)
    }

    return { isLoop: false, target: realPath }
  } catch (err) {
    // ELOOP from system indicates circular reference
    if ((err as NodeJS.ErrnoException).code === 'ELOOP') {
      return { isLoop: true }
    }
    throw err
  }
}

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
  { dirFilter = (dirent) => true, dirSort = (a, b) => 0, onlyDirs = false, statFn = statAsync, fileTypes, useSessionCache = true }: {
    dirFilter?: (dirent: any) => boolean
    dirSort?: (a: any, b: any) => number
    onlyDirs?: boolean
    statFn?: typeof statAsync
    fileTypes?: string[]
    /** Use session-level LRU cache for stat calls (default: true) */
    useSessionCache?: boolean
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

  const dirFiles = await pathDebug.timeAsync('readdir', () =>
    readdir(startPath, { withFileTypes: true })
  )

  dirFiles.sort((a, b) => {
    const aStarts = a.name.startsWith('.')
    const bStarts = b.name.startsWith('.')
    return aStarts === bStarts ? 0 : aStarts ? 1 : -1
  })

  const dirents = dirFiles.filter(dirFilter)
  const validDirents: (Dirent & { isSymlinkLoop?: boolean })[] = []

  // Use session cache or create a local one
  const getCachedStat = async (path: string): Promise<Stats> => {
    if (useSessionCache) {
      return sessionStatCache.get(path, statFn)
    }
    return statFn(path)
  }

  // Helper to get base path for a Dirent. Some Node versions expose
  // an undocumented `path` field on `Dirent`; types may not include it.
  const getDirentBasePath = (dirent: Dirent | any, fallback: string) =>
    typeof dirent?.path === 'string' ? (dirent.path as string) : fallback

  // Process symlinks in parallel with loop detection
  await pathDebug.timeAsync('process-symlinks', () =>
    Promise.all(
      dirents.map(async (dirent: Dirent & { isSymlinkLoop?: boolean }) => {
        if (dirent.isSymbolicLink()) {
          const linkPath = ogPath.resolve(getDirentBasePath(dirent, startPath), dirent.name)

          try {
            // Check for symlink loops first
            const loopCheck = await detectSymlinkLoop(linkPath)

            if (loopCheck.isLoop) {
              // Mark as loop but still include in listing with indicator
              dirent.isSymlinkLoop = true
              validDirents.push(dirent)
              return
            }

            const resolved = loopCheck.target || await fs.promises.realpath(linkPath)
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
          } catch (err) {
            // Log the error but don't crash - skip invalid symlinks
            if (pathDebug.enabled) {
              global.log?.(`[path-debug] Skipping invalid symlink: ${linkPath} - ${(err as Error).message}`)
            }
          }
        } else {
          validDirents.push(dirent)
        }
      })
    )
  )

  const folderSet = new Set(validDirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name))
  const folders = validDirents.filter((dirent) => folderSet.has(dirent.name))
  const files = onlyDirs ? [] : validDirents.filter((dirent) => !folderSet.has(dirent.name))

  const mapDirents = async (dirents: (Dirent & { isSymlinkLoop?: boolean })[]): Promise<Choice[]> => {
    const choices = await pathDebug.timeAsync('map-dirents', () =>
      Promise.all(dirents.map(async (dirent) => {
        const fullPath = ogPath.resolve(
          getDirentBasePath(dirent, startPath),
          dirent.name
        )

        // Handle symlink loops specially
        if (dirent.isSymlinkLoop) {
          return {
            img: pathToFileURL(kitPath('icons', 'folder.svg')).href,
            name: `${dirent.name} ↩️`,
            value: toUiPath(fullPath),
            description: '⚠️ Circular symlink - cannot follow',
            drag: toUiPath(fullPath),
            mtime: new Date(),
            size: 0,
            disabled: true
          } as Choice
        }

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
    )
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
      // Track this folder as recently visited
      if (startPath && startPath !== '/' && startPath !== home()) {
        recentFolders.add(startPath)
      }

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
      // Create structured error with helpful hints
      const pathError = error instanceof PathError
        ? error
        : PathError.fromNodeError(error as NodeJS.ErrnoException, startPath)

      const errorPanel = `### Failed to read \`${startPath}\`

**Error:** ${pathError.message}
**Code:** \`${pathError.code}\`

${pathError.hint ? `**Hint:** ${pathError.hint}` : ''}
`
      setPanel(md(errorPanel))
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
    global.log(`[path] upDir called: dir.name=${dir?.name}, dir.value=${dir?.value}, dir.miss=${dir?.miss}`)
    if (dir?.miss) {
      return
    }

    // Get the current path from the actual input state, not startPath
    // This ensures we're always working with the most current value
    const currentPath = global.__kitPromptState?.input || currentInput || startPath
    global.log(`[path] upDir: currentPath=${currentPath}, startPath=${startPath}`)

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
    global.log(`[path] downDir called: dir.name=${dir?.name}, dir.value=${dir?.value}, dir.miss=${dir?.miss}`)
    if (dir?.miss) {
      return
    }

    // Get the current path from the actual input state, not startPath
    const currentPath = global.__kitPromptState?.input || currentInput || startPath
    global.log(`[path] downDir: currentPath=${currentPath}, startPath=${startPath}`)

    let targetPath = typeof dir === 'string' ? ogPath.resolve(currentPath, dir) : dir.value
    global.log(`[path] downDir: targetPath=${targetPath}`)
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
    global.log(`[path] onRight called: input=${input}, flaggedValue=${state?.flaggedValue}, focused=${state?.focused?.name}`)
    if (!state.flaggedValue) {
      // Handle case where focused is stale/invalid (e.g., __app__/no-choice sentinel)
      // This can happen due to timing issues when the renderer hasn't updated focusedChoiceAtom yet
      const focused = state.focused
      if (!focused?.value || focused?.name === '__app__/no-choice') {
        global.log(`[path] onRight: focused is invalid (${focused?.name}), using first available choice`)
        // Try to get the first valid choice from kitPrevChoices
        const firstChoice = global.kitPrevChoices?.find(c => c?.value && !c?.miss && c?.name !== '__app__/no-choice')
        if (firstChoice) {
          global.log(`[path] onRight: using fallback choice: ${firstChoice.name}`)
          downDir(firstChoice)
        } else {
          global.log(`[path] onRight: no valid fallback choice available`)
        }
      } else {
        downDir(focused)
      }
    }
  }

  let onLeft = (input, state) => {
    global.log(`[path] onLeft called: input=${input}, flaggedValue=${state?.flaggedValue}, focused=${state?.focused?.name}`)
    if (!state.flaggedValue) {
      // Handle case where focused is stale/invalid - upDir doesn't strictly need a valid focused
      // since it navigates up regardless, but we pass the focused for history tracking
      const focused = state.focused
      if (!focused?.value || focused?.name === '__app__/no-choice') {
        global.log(`[path] onLeft: focused is invalid (${focused?.name}), using first available choice`)
        const firstChoice = global.kitPrevChoices?.find(c => c?.value && !c?.miss && c?.name !== '__app__/no-choice')
        upDir(firstChoice || focused)
      } else {
        upDir(focused)
      }
    }
  }

  // Map FORWARD/BACK channels to right/left navigation
  let onForward = (input, state) => {
    global.log(`[path] onForward called: input=${input}`)
    onRight(input, state)
  }
  let onBack = (input, state) => {
    global.log(`[path] onBack called: input=${input}`)
    onLeft(input, state)
  }

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
        {
          name: 'Recent',
          key: `${cmd}+r`,
          visible: true,
          bar,
          onPress: async () => {
            const recent = recentFolders.getAll()
            if (recent.length === 0) {
              setPanel(md('### No recent folders\n\nNavigate to some folders first to build your history.'))
              return
            }

            const recentChoices: Choice[] = recent.map((folder, index) => ({
              name: ogPath.basename(folder) || folder,
              value: folder,
              description: folder,
              img: pathToFileURL(kitPath('icons', 'folder.svg')).href,
              // Add keyboard shortcut hints for first 9 items
              enter: index < 9 ? `Press ${index + 1} to select` : undefined
            }))

            await setChoices(recentChoices, {
              skipInitialSearch: true
            })
            setPanel(md('### Recent Folders\n\nSelect a folder or press Escape to return.'))
          }
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
