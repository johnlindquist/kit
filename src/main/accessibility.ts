// Name: Enable Accessibility
// Description: Enable Clipboard and Keyboard Watching

import { Channel } from "../core/enum.js"

await div({
  html: md(`## Prompting for Accessibility Permissions
  
- Kit needs permission to watch your clipboard and keyboard. This is a one-time prompt.
- Kit.app will quit once it detects the permissions have been granted.  
  `),
  onInit: async () => {
    await sendWait(Channel.ENABLE_ACCESSIBILITY, {})
  },
})
