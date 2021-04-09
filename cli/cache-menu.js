let { menu } = await cli("fns");
let menuData = await menu();
await writeFile(kenvPath("cache", "menu-cache.json"), JSON.stringify(menuData));
export {};
