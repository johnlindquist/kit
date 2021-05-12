let { default: low }: any = await import("lowdb")
let { default: FileSync }: any = await import(
  "lowdb/adapters/FileSync.js"
)
let { default: lodashId }: any = await import("lodash-id")

global.db = (key: any, defaults: any) => {
  let _db = low(
    new FileSync(global.kenvPath("db", `${key}.json`))
  )

  _db._.mixin(lodashId)
  _db.defaults(defaults).write()

  return _db
}

export {}
