import { KIT_NODE_PATH } from "../core/util.js"

export {}

let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let packages = (await arg(
  chalk`Which packages do you want to {red uninstall}`,
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ]
)) as string[]

//grab all the args you used `kit un jquery react`
if (typeof packages == "string") {
  packages = [packages, ...args]
}

let uninstallPackage = spawn(
  kitPath("node", "bin", "npm"),
  [
    "uninstall",
    "--prefix",
    kenvPath(),
    ...packages,
    ...args,
  ],
  {
    stdio: "inherit",
    cwd: env.KENV,
    env: {
      PATH: KIT_NODE_PATH,
    },
  }
)

uninstallPackage.on("error", error => {
  console.log({ error })
})
