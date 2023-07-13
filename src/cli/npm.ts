import { adjustPackageName } from "../core/utils.js"

delete flag.trigger
delete flag.force

let missingPackages = [
  ...new Set(
    args.slice(0).map(pkg => adjustPackageName(pkg))
  ),
]
args = []

for await (let missingPackage of missingPackages) {
  await installMissingPackage(missingPackage)
}

export {}
