let { default: low } = await import("lowdb");
let { default: FileSync } = await import("lowdb/adapters/FileSync.js");
let { default: lodashId } = await import("lodash-id");
global.db = (key, defaults) => {
    let _db = low(new FileSync(global.kenvPath("db", `${key}.json`)));
    _db._.mixin(lodashId);
    _db.defaults(defaults).write();
    return _db;
};
export {};
