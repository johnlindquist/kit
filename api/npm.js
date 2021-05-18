let defaultImport = async (modulePath) => {
    let pkg = await import(modulePath);
    if (pkg.default)
        return pkg.default;
    return pkg;
};
let kenvImport = async (packageName) => {
    try {
        let pkgPackageJson = JSON.parse(await readFile(kenvPath("node_modules", packageName, "package.json"), "utf-8"));
        return await defaultImport(kenvPath("node_modules", packageName, pkgPackageJson.module ||
            (pkgPackageJson?.main?.endsWith(".js") &&
                pkgPackageJson.main) ||
            "index.js"));
    }
    catch (error) {
        throw new Error(error);
    }
};
export let createNpm = npmInstall => async (packageName) => {
    try {
        let { dependencies: kitDeps } = JSON.parse(await readFile(kitPath("package.json"), "utf-8"));
        if (kitDeps[packageName]) {
            return await defaultImport(packageName);
        }
        return await kenvImport(packageName);
        // }
    }
    catch (error) {
        await npmInstall(packageName);
        return await kenvImport(packageName);
    }
};
