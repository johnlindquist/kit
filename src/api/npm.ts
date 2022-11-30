import { pathToFileURL } from "url"

let defaultImport = async (modulePath: string) => {
  let pkg = await import(modulePath)
  if (pkg.default) return pkg.default
  return pkg
}

interface PackageJson {
  main?: string
  module?: string
  exports?: any
  type?: string
}

let findMain = async (
  packageName: string,
  packageJson: PackageJson
) => {
  try {
    let kPath = (...pathParts: string[]) =>
      global.kenvPath(
        "node_modules",
        packageName,
        ...pathParts
      )

    let { module, main, type } = packageJson

    if (module && type == "module") return kPath(module)
    if (main && (await global.isFile(kPath(main))))
      return kPath(main)
    if (main && main.endsWith(".js")) return kPath(main)
    if (main && !main.endsWith(".js")) {
      // Author forgot to add .js
      if (await global.isFile(kPath(`${main}.js`))) {
        return kPath(`${main}.js`)
      }

      // "main" is just a path that contains index.js
      if (await global.isFile(kPath(main, "index.js"))) {
        return kPath(main, "index.js")
      }
    }
    return kPath("index.js")
  } catch (error) {
    throw new Error(error)
  }
}

let kenvImport = async packageName => {
  try {
    let packageJson = global.kenvPath(
      "node_modules",
      packageName,
      "package.json"
    )

    if (process.env.KIT_CONTEXT == "github-workflow") {
      console.log(
        `🕵️‍♀️ GitHub Workflow Detected. Using scripts dir...`
      )
      packageJson = global.kenvPath(
        "scripts",
        "node_modules",
        packageName,
        "package.json"
      )

      console.log({ packageJson })
    }

    if (!(await global.isFile(packageJson))) {
      throw new Error(`${packageJson} doesn't exist`)
    }

    let pkgPackageJson = JSON.parse(
      await global.readFile(packageJson, "utf-8")
    )

    let mainModule = await findMain(
      packageName,
      pkgPackageJson
    )
    return await defaultImport(
      pathToFileURL(mainModule).toString()
    )
  } catch (error) {
    throw new Error(error)
  }
}

export let createNpm =
  npmInstall => async packageNameWithVersion => {
    // remove any version numbers
    let packageName = packageNameWithVersion.replace(
      /(?<=.)(@|\^|~).*/g,
      ""
    )
    let {
      dependencies: kitDeps = {},
      devDependencies: devDeps = {},
    } = JSON.parse(
      await global.readFile(
        global.kitPath("package.json"),
        "utf-8"
      )
    )
    let isKitDep =
      kitDeps[packageName] || devDeps[packageName]
    if (isKitDep) {
      return defaultImport(packageName)
    }
    //fix missing kenv dep
    let {
      dependencies: kenvDeps = {},
      devDependencies: kenvDevDeps = {},
    } = JSON.parse(
      await global.readFile(
        global.kenvPath("package.json"),
        "utf-8"
      )
    )
    let isKenvDep =
      kenvDeps?.[packageName] || kenvDevDeps?.[packageName]
    if (isKenvDep) {
      return kenvImport(packageName)
    }
    await npmInstall(packageNameWithVersion)
    return await kenvImport(packageName)
  }
