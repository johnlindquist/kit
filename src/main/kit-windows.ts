// Name: Focus Kit Window
// Description: Focus a Kit Window
// Keyword: kw
// Enter: Focus

import { Choice } from "@johnlindquist/kit"
import { KitWindow } from "../types/platform"

let windows = await getKitWindows()
windows = windows.filter(w => !w.isFocused)

if (!windows.length) {
  await div(
    md(`# No Kit Windows Found...
    
Try launching a script with a "widget", then run this again.    

~~~js
await widget(md(\`# Hello world\`), {
    title: "My Widget",
})
~~~
    `)
  )
} else {
  let id = await arg(
    {
      placeholder: "Focus Kit Window",
      enter: "Focus",
      ignoreBlur: true,
    },
    windows as Choice[]
  )

  await focusKitWindow(id)
}
