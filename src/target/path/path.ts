import fs from 'node:fs'
import { unlink } from 'node:fs/promises'
import { filesize } from 'filesize'
import * as ogPath from 'node:path'

import { formatDistanceToNow, compareAsc } from '@johnlindquist/kit-internal/date-fns'

import type { Dirent } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { PathConfig, PathDefaultMissingValues } from '../../types/kit'
import type { Action, Choice, PromptConfig } from '../../types'
import { Channel } from '../../core/enum.js'

export const createPathChoices = async (
  startPath: string,
  { dirFilter = (dirent) => true, dirSort = (a, b) => 0, onlyDirs = false } = {}
) => {
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

  const getCachedStat = (path: string) => {
    if (!statCache.has(path)) {
      statCache.set(path, fs.statSync(path))
    }
    return statCache.get(path)
  }

  // Process symlinks in parallel
  await Promise.all(
    dirents.map(async (dirent) => {
      if (dirent.isSymbolicLink()) {
        try {
          const resolved = await fs.promises.realpath(ogPath.resolve(dirent.path, dirent.name))
          const stats = getCachedStat(resolved)

          Object.assign(dirent, {
            path: path.dirname(resolved),
            name: path.basename(resolved),
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

  const mapDirents = (dirents: Dirent[]): Choice[] => {
    return dirents.map((dirent) => {
      const fullPath = ogPath.resolve(dirent.path, dirent.name)
      const { size, mtime } = getCachedStat(fullPath)

      const type = folderSet.has(dirent.name) ? 'folder' : 'file'
      const description = type === 'folder' ? '' : `${filesize(size)} - Last modified ${formatDistanceToNow(mtime)} ago`

      const img = pathToFileURL(kitPath('icons', `${type}.svg`)).href

      return {
        img,
        name: dirent.name,
        value: fullPath,
        description,
        drag: fullPath,
        mtime,
        size
      } as const
    })
  }

  const mapped = mapDirents(folders.concat(files))

  return mapped.sort(dirSort)
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
  if (typeof config === 'string') {
    startPath = config
  }
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
        onlyDirs
      })

      choices.push(...missingChoices)

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

  if (!startPath.endsWith(path.sep) && (await isDir(startPath))) {
    startPath += path.sep
  }
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
    await setInput(path.dirname(startPath) + path.sep)
    if (dir) {
      focusOn = path.basename(path.dirname(dir))
    }
  }

  let downDir = async (dir) => {
    if (dir?.miss) {
      return
    }
    let targetPath = ogPath.resolve(startPath, dir)
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
        setInput(targetPath + path.sep)
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
    if (currentSlashCount !== slashCount || (input.endsWith(path.sep) && inputLess)) {
      slashCount = currentSlashCount
      await lsCurrentDir(input)
    }
  }

  let onTab = (input, state) => {
    let dir = state.focused.value

    if (state.modifiers.includes('shift')) {
      upDir(dir)
    } else {
      downDir(dir)
    }
  }

  let onRight = (input, state) => {
    downDir(state.focused.value)
  }

  let onLeft = (input, state) => {
    upDir(state.focused.value)
  }

  let onEscape = () => {
    mainScript()
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
        onlyDirs
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
      // onRight,
      // onLeft,
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

// Try to open non-existent ~/.huskyrc
