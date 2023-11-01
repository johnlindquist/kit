import { adjustPackageName } from "../core/utils.js"

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

for await (let missingPackage of missingPackages) {
  await installMissingPackage(missingPackage)
}

export {}
