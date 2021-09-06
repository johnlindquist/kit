"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNpm = void 0;
let defaultImport = async (modulePath) => {
    let pkg = await Promise.resolve().then(() => __importStar(require(modulePath)));
    if (pkg.default)
        return pkg.default;
    return pkg;
};
let findMain = async (packageName, packageJson) => {
    try {
        let kPath = (...pathParts) => kenvPath("node_modules", packageName, ...pathParts);
        let { module, main, type } = packageJson;
        if (module && type == "module")
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
        let mainModule = await findMain(packageName, pkgPackageJson);
        return await defaultImport(mainModule);
    }
    catch (error) {
        throw new Error(error);
    }
};
let createNpm = npmInstall => async (packageName) => {
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
exports.createNpm = createNpm;
