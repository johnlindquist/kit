let { Low, JSONFile } = await import("lowdb");
import { resolveScriptToCommand } from "../../utils.js";
global.db = async (key, defaults, fromCache = true) => {
    if (typeof defaults === "undefined" &&
        typeof key !== "string") {
        defaults = key;
        key = "_" + resolveScriptToCommand(global.kitScript);
    }
    let dbPath = global.kenvPath("db", `${key}.json`);
    if (key.startsWith(path.sep)) {
        dbPath = key;
    }
    let _db = new Low(new JSONFile(dbPath));
    await _db.read();
    if (!_db.data || !fromCache) {
        console.log(`🔄 Refresh db ${key}`);
        let getData = async () => {
            if (typeof defaults === "function") {
                let data = await defaults();
                if (Array.isArray(data))
                    return { items: data };
                return data;
            }
            if (Array.isArray(defaults))
                return { items: defaults };
            return defaults;
        };
        _db.data = await getData();
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
