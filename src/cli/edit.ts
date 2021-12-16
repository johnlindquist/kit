// Description: Opens the selected script in your editor

let { filePath } = await selectScript(
  `Select script to open in ${await env("KIT_EDITOR")}?`
)

edit(filePath, kenvPath())

export {}
