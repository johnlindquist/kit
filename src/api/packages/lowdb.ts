let { Low, JSONFile } = await import("lowdb")

global.db = async (key: any, defaults) => {
  let _db = new Low(
    new JSONFile(global.kenvPath("db", `${key}.json`))
  )

  await _db.read()

  if (!_db.data) {
    _db.data =
      typeof defaults === "function"
        ? await defaults()
        : defaults
    await _db.write()
  }

  return new Proxy({} as any, {
    get: (_target, k: string) => {
      if (k === "then") return _db
      if (_db[k]) {
        return typeof _db[k] === "function"
          ? _db[k].bind(_db)
          : _db[k]
      }
      return _db?.data?.[k]
    },
  })
}

export {}
