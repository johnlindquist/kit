import { getAppDb, appDefaults } from "../core/db.js"

let copyIfNotExists = async (p: string, dest: string) => {
  if (!(await isFile(p))) await copyFile(p, dest)
}

try {
  let kenvPkgPath = kenvPath("package.json")
  let kenvPkg = await readJson(kenvPkgPath)

  if (!kenvPkg?.dependencies?.["@johnlindquist/kit"]) {
    await cli("install", kitPath())
  }

  await copyIfNotExists(
    kitPath("templates", "config", "tsconfig.json"),
    kenvPath("tsconfig.json")
  )

  await copyIfNotExists(
    kitPath("templates", "scripts", "default.js"),
    kenvPath("templates", "default.js")
  )

  await copyIfNotExists(
    kitPath("templates", "scripts", "default.ts"),
    kenvPath("templates", "default.ts")
  )

  if (kenvPkg.dependencies?.kit) {
    await cli("uninstall", "kit")
  }

  let kenvIgnore = kenvPath(".gitignore")
  if (await pathExists(kenvIgnore)) {
    let contents = await readFile(kenvIgnore, "utf-8")
    if (!contents.match(/^\.scripts$/gm)) {
      await appendFile(
        kenvIgnore,
        `
.scripts`
      )
    }
  }

  let appDb = await getAppDb()
  for (let [k, v] of Object.entries(appDefaults)) {
    if (appDb?.[k] === undefined) appDb[k] = v
  }
  await appDb.write()
} catch (error) {
  console.log(error)
}

export {}
