// Name: Main
// Description: Script Kit
// Placeholder: Run script
// UI: arg
// preview: true
setDescription(`Script Kit`)
export interface Main {
  edit: Promise<typeof import("./edit")>
  help: Promise<typeof import("./help")>
  hot: Promise<typeof import("./hot")>
  index: Promise<typeof import("./index")>
  kenv: Promise<typeof import("./kenv")>
  kit: Promise<typeof import("./kit")>
  new: Promise<typeof import("./new")>
  showandtell: Promise<typeof import("./showandtell")>
}

interface MainModuleLoader {
  (
    packageName: keyof Main,
    ...moduleArgs: string[]
  ): Promise<any>
}

declare global {
  var main: MainModuleLoader
}

global.onTabs = []

onTab("Run", async (input = "") => {
  await cli("app-run", "--input", input)
})

onTab("New", async (input = "") => {
  await main("new", "--input", input)
})

onTab("Kit", async (input = "") => {
  await main("kit", "--input", input)
})

onTab("Docs", async (input = "") => {
  await main("help", "--input", input)
})

onTab("Hot 🔥", async (input = "") => {
  await main("hot", "--input", input)
})

export {}
