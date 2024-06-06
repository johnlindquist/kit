import { adjustPackageName } from "../core/utils.js"
import { appInstallMultiple } from "../target/app.js"

delete flag.trigger
delete flag.force

let missingPackages = [
  ...new Set(
    args.reduce(
      (acc, pkg) => (
        !pkg.startsWith("node:") &&
          acc.push(adjustPackageName(pkg)),
        acc
      ),
      []
    )
  ),
]
args = []

if (missingPackages.length > 1) {
  await appInstallMultiple(missingPackages)
} else if (missingPackages.length === 1) {
  await installMissingPackage(missingPackages[0])
}

export {}
