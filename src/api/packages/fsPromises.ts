import {
  readFile,
  writeFile,
  appendFile,
  readdir,
  copyFile,
} from "fs/promises"
let {
  emptyDir,
  ensureFile,
  ensureDir,
  ensureLink,
  ensureSymlink,
  mkdirp,
  mkdirs,
  outputFile,
  outputJson,
  pathExists,
  readJson,
  remove,
  writeJson,
} = await import("fs-extra")
global.readFile = readFile
global.writeFile = writeFile
global.appendFile = appendFile
global.readdir = readdir
global.copyFile = copyFile

global.emptyDir = emptyDir
global.ensureFile = ensureFile
global.ensureDir = ensureDir
global.ensureLink = ensureLink
global.ensureSymlink = ensureSymlink
global.mkdirp = mkdirp
global.mkdirs = mkdirs
global.outputFile = outputFile
global.outputJson = outputJson
global.pathExists = pathExists
global.readJson = readJson
global.remove = remove
global.writeJson = writeJson
