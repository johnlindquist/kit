// Description: Kit.app Settings


import { getAppDb } from "../core/db.js"
import { Choice } from "../types/core.js"

let createCheckbox = (id: string, name: string, value: boolean, preview: string): Choice => {
    let html = `<div class="flex justify-between w-full h-full items-center">
    <span>${name}</span>
    
        <span class="text-2xl">
            ${value ? `☑` : `◽️`}
        </span
    
</div>`

    return {
        id,
        name,
        html,
        value: id,
        preview: md(`${preview}
        
[${value ? `Disable` : `Enable`}](submit:${id})`, "p-5 prose dark:prose-dark prose-sm")
    }
}

while (true) {
    let d = await getAppDb()

    let key = await arg("Settings", [
        createCheckbox(`openAtLogin`, "Open at Login", d.openAtLogin, `
# Open Kit.app at Login
`),
        createCheckbox(`tray`, "Show Icon in Menu Bar", d.tray, `
# Show Icon in Menu Bar
`),
        createCheckbox(`autoUpdate`, "Automatically Update", d.autoUpdate, `
# Automatically Update Kit.app
        `)
    ])

    if (typeof d?.[key] !== "undefined") {
        let toggled = !d[key]
        d[key] = toggled
        console.log(`${key} set to ${toggled}`)
        await d.write()
    }
}

export { }