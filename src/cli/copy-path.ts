//Menu: Copy Script to Clipboard
//Description: Copies Script to Clipboard

let { filePath } = await selectScript(`Share which script?`)

copy(filePath)
div(
  md(
    `<code class="text-xxs">${filePath}</code> copied to clipboard`
  )
)
await wait(2000, null)

export {}
