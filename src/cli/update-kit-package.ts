import { KIT_FIRST_PATH } from "../core/utils.js"
import { createPackageManagerCommand } from "./lib/install.js"

let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let packages = (await arg(
  {
    placeholder: `Which package do you want to update to latest?`,
    enter: "Update",
  },
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ].filter(k => !k.startsWith("@johnlindquist/kit"))
)) as string[]

//grab all the args you used `kit un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

packages = packages.map(p => `${p}@latest`)

let command = await createPackageManagerCommand(
  "i",
  packages
)

let cwd = kenvPath()

if (process.env.SCRIPTS_DIR) {
  cwd = kenvPath(process.env.SCRIPTS_DIR)
}

await term({
  command,
  env: {
    ...global.env,
    PATH: KIT_FIRST_PATH,
  },
  cwd,
})

export {}
