delete flag.trigger
delete flag.force

let missingPackage = await arg()

await npm(missingPackage)

export {}
