let { Low, JSONFile } = await import("lowdb");
global.db = async (key, defaults, fromCache = true) => {
    let dbPath = global.kenvPath("db", `${key}.json`);
    if (key.startsWith(path.sep)) {
        dbPath = key;
    }
    let _db = new Low(new JSONFile(dbPath));
    await _db.read();
    if (!_db.data || !fromCache) {
        console.log(`>>>>>>>>>>>>>> Refresh db ${key}`);
        _db.data =
            typeof defaults === "function"
                ? await defaults()
                : defaults;
        await _db.write();
    }
    return new Proxy({}, {
        get: (_target, k) => {
            if (k === "then")
                return _db;
            if (_db[k]) {
                return typeof _db[k] === "function"
                    ? _db[k].bind(_db)
                    : _db[k];
            }
            return _db?.data?.[k];
        },
    });
};
export {};
