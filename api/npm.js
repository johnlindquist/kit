let defaultImport = async (modulePath) => {
    let pkg = await import(modulePath);
    if (pkg.default)
        return pkg.default;
    return pkg;
};
let findMain = async (packageName, packageJson) => {
    try {
        let kPath = (...pathParts) => kenvPath("node_modules", packageName, ...pathParts);
        let { module, main } = packageJson;
        if (module)
            return kPath(module);
        if (main && main.endsWith(".js"))
            return kPath(main);
        if (main && !main.endsWith(".js")) {
            // Author forgot to add .js
            if (await isFile(kPath(`${main}.js`))) {
                return kPath(`${main}.js`);
            }
            // "main" is just a path that contains index.js
            if (await isFile(kPath(main, "index.js"))) {
                return kPath(main, "index.js");
            }
        }
        return kPath("index.js");
    }
    catch (error) {
        throw new Error(error);
    }
};
let kenvImport = async (packageName) => {
    try {
        let packageJson = kenvPath("node_modules", packageName, "package.json");
        if (!(await isFile(packageJson))) {
            throw new Error(`${packageJson} doesn't exist`);
        }
        let pkgPackageJson = JSON.parse(await readFile(packageJson, "utf-8"));
        return await defaultImport(await findMain(packageName, pkgPackageJson));
    }
    catch (error) {
        throw new Error(error);
    }
};
export let createNpm = npmInstall => async (packageName) => {
    let { dependencies: kitDeps } = JSON.parse(await readFile(kitPath("package.json"), "utf-8"));
    let isKitDep = kitDeps[packageName];
    if (isKitDep) {
        return defaultImport(packageName);
    }
    let { dependencies: kenvDeps } = JSON.parse(await readFile(kenvPath("package.json"), "utf-8"));
    let isKenvDep = kenvDeps[packageName];
    if (isKenvDep) {
        return kenvImport(packageName);
    }
    await npmInstall(packageName);
    return await kenvImport(packageName);
};
