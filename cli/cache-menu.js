let { buildMenu } = await cli("fns");
let menuData = await buildMenu(false);
await writeFile(kenvPath("cache", "menu-cache.json"), JSON.stringify(menuData));
export {};
