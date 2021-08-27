console.log(`Starting postinstall`)
console.log(kitPath("src"))
await trash(kitPath("src", "*"))

let tmpScriptsPath = kitPath("tmp", "scripts")
cp(kenvPath("scripts/*"), tmpScriptsPath)

export {}
