let kitAppDb = await db(kitAppPath("db", "app.json"));
let kenv = await arg(`Select kenv`, kitAppDb.KENVS);
global.send("SWITCH_KENV", { kenvPath: kenv });
export {};
