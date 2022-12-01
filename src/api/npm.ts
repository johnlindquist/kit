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
  parent = "",
  packageName: string,
  packageJson: PackageJson
) => {
  try {
    let kPath = (...pathParts: string[]) =>
      global.kenvPath(
        parent,
        "node_modules",
        packageName,
        ...pathParts
      )

    // if kPath doesn't exist, return false
    if (!(await global.isDir(kPath()))) {
      return false
    }

    let { module, main, type, exports } = packageJson

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
    if (exports && exports?.["."])
      return kPath(exports?.["."])

    return kPath("index.js")
  } catch (error) {
    throw new Error(error)
  }
}

let findPackageJson =
  (packageName: string) =>
  async (parent = "") => {
    let packageJson = global.kenvPath(
      parent,
      "node_modules",
      packageName,
      "package.json"
    )

    if (!(await global.isFile(packageJson))) {
      return false
    }

    let pkgPackageJson = JSON.parse(
      await global.readFile(packageJson, "utf-8")
    )

    let mainModule = await findMain(
      parent,
      packageName,
      pkgPackageJson
    )

    return mainModule || false
  }

let kenvImport = async (packageName: string) => {
  try {
    let findMainFromPackageJson =
      findPackageJson(packageName)

    let mainModule = await findMainFromPackageJson("")
    if (mainModule)
      return await defaultImport(
        pathToFileURL(mainModule).toString()
      )

    mainModule = await findMainFromPackageJson(
      process.env.SCRIPTS_DIR
    )
    if (mainModule)
      return await defaultImport(
        pathToFileURL(mainModule).toString()
      )

    throw new Error(
      `Could not find main module for ${packageName}`
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

    let pkgPath = global.kenvPath(
      process.env.SCRIPTS_DIR || "",
      "package.json"
    )

    if (!(await global.isFile(pkgPath))) {
      throw new Error(
        `Could not find package.json at ${pkgPath}`
      )
    }

    //fix missing kenv dep
    let {
      dependencies: kenvDeps = {},
      devDependencies: kenvDevDeps = {},
    } = JSON.parse(await global.readFile(pkgPath, "utf-8"))

    let isKenvDep =
      kenvDeps?.[packageName] || kenvDevDeps?.[packageName]

    if (isKenvDep) {
      global.log(`Found ${packageName} in ${pkgPath}`)
      return kenvImport(packageName)
    }
    await npmInstall(packageNameWithVersion)
    return await kenvImport(packageName)
  }
