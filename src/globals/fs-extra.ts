import fs from "fs-extra"
import type { JsonReadOptions, JsonWriteOptions } from "fs-extra"

export let emptyDir = (global.emptyDir = fs.emptyDir)
export let emptyDirSync = (global.emptyDirSync = fs.emptyDirSync)
export let ensureFile = (global.ensureFile = fs.ensureFile)
export let ensureFileSync = (global.ensureFileSync = fs.ensureFileSync)
export let ensureDir = (global.ensureDir = fs.ensureDir)
export let ensureDirSync = (global.ensureDirSync = fs.ensureDirSync)
export let ensureLink = (global.ensureLink = fs.ensureLink)
export let ensureLinkSync = (global.ensureLinkSync = fs.ensureLinkSync)
export let ensureSymlink = (global.ensureSymlink = fs.ensureSymlink)
export let ensureSymlinkSync = (global.ensureSymlinkSync = fs.ensureSymlinkSync)
export let mkdirp = (global.mkdirp = fs.mkdirp)
export let mkdirpSync = (global.mkdirpSync = fs.mkdirpSync)
export let mkdirs = (global.mkdirs = fs.mkdirs)
export let mkdirsSync = (global.mkdirsSync = fs.mkdirsSync)
export let outputFile = (global.outputFile = fs.outputFile)
export let outputFileSync = (global.outputFileSync = fs.outputFileSync)
export let outputJson = (global.outputJson = fs.outputJson)
export let outputJsonSync = (global.outputJsonSync = fs.outputJsonSync)
export let pathExists = (global.pathExists = fs.pathExists)
export let pathExistsSync = (global.pathExistsSync = fs.pathExistsSync)
export let readJson: {
  <T = any>(file: string, options?: JsonReadOptions | undefined): Promise<T>
  (file: string, options?: JsonReadOptions | undefined): Promise<any>
} = (global.readJson = fs.readJson)
export let readJsonSync: {
  <T = any>(file: string, options?: JsonReadOptions | undefined): T
  (file: string, options?: JsonReadOptions | undefined): any
} = (global.readJsonSync = fs.readJsonSync)
export let remove = (global.remove = fs.remove)
export let removeSync = (global.removeSync = fs.removeSync)
export let writeJson: <T>(file: string, object: T, options?: JsonWriteOptions | undefined) => Promise<void> = (global.writeJson = fs.writeJson)
export let writeJsonSync: <T>(file: string, object: T, options?: JsonWriteOptions | undefined) => void = (global.writeJsonSync = fs.writeJsonSync)
export let move = (global.move = fs.move)
export let moveSync = (global.moveSync = fs.moveSync)
