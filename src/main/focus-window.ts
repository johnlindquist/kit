// Name: Focus Window
// Description: List and Focus Open Application Windows
// Keyword: w
// Cache: true

import '@johnlindquist/kit'
import { escapeShortcut } from '../core/utils.js'
import type { Choice } from '../types/core.js'

let isMac = process.platform === 'darwin'

if (isMac) {
  let { getWindowsList } = await import('@johnlindquist/mac-windows')

  let apps = await db<{ choices: Choice[] }>(kitPath('db', 'apps.json'))

  let windows = await getWindowsList({
    showAllWindows: true,
    onScreenOnly: false
  })

  // Added extra junk windows to the ignore list and removed the name check
  let ignore = [
    'Notification Center',
    'Dock',
    'AvatarPickerMemojiPicker',
    'com.apple.preference.security.r',
    'Kit',
    'CursorUIViewService',
    'loginWindow',
    'com.apple.PressAndHold',
    'Script Kit',
    'Spotlight'
  ]

  let selectedWindow = await arg<{
    name: string
    ownerName: string
    number: number
    pid: number
  }>(
    {
      placeholder: 'Focus Window',
      enter: 'Focus',
      shortcuts: [escapeShortcut],
      resize: true,
      searchKeys: ['slicedName', 'friendlyShortcut', 'tag', 'group', 'command', 'description']
    },
    windows
      .filter((w) => !ignore.includes(w.ownerName))
      .map((w) => {
        let img =
          (apps?.choices?.length ? apps.choices : []).find(
            (a) => a.name === w.ownerName || a.name.includes(w.ownerName)
          )?.img || ''
        return {
          name: w.ownerName,
          description: w.name || w.ownerName, // fallback to ownerName when name is empty
          img,
          value: w
        }
      })
  )
  await hide()
  await focusWindow(selectedWindow.ownerName, selectedWindow.name)
}
