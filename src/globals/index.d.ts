import type { EnsureReadFile, EnsureReadJson } from './custom.ts'
import type { Md } from './marked.ts'

export * from './axios.ts'
export * from './chalk.ts'
export * from './child_process.ts'
export * from './crypto'
export * from './custom.ts'
export * from './download.ts'
export * from './execa.ts'
export * from './fs-extra.ts'
export * from './fs.ts'
export * from './globby.ts'
export * from './handlebars.ts'
export * from './marked.ts'
export * from './path'
export * from './process.ts'
export * from './replace-in-file.ts'
export * from './stream.ts'

export interface GlobalsApi {
  cwd: typeof process.cwd
  pid: typeof process.pid
  stderr: typeof process.stderr
  stdin: typeof process.stdin
  stdout: typeof process.stdout
  uptime: typeof process.uptime
  get: import('axios').AxiosInstance['get']
  put: import('axios').AxiosInstance['put']
  post: import('axios').AxiosInstance['post']
  patch: import('axios').AxiosInstance['patch']
  chalk: typeof import('chalk-template').default
  spawn: typeof import('child_process').spawn
  spawnSync: typeof import('child_process').spawnSync
  fork: typeof import('child_process').fork
  exec: typeof import('execa').execaCommand
  execa: typeof import('execa').execa
  execaSync: typeof import('execa').execaSync
  execaCommand: typeof import('execa').execaCommand
  execaCommandSync: typeof import('execa').execaCommandSync
  execaNode: typeof import('execa').execaNode
  $: typeof import('execa').$

  download: typeof import('download')

  emptyDir: typeof import('fs-extra').emptyDir
  emptyDirSync: typeof import('fs-extra').emptyDirSync
  ensureFile: typeof import('fs-extra').ensureFile
  ensureFileSync: typeof import('fs-extra').ensureFileSync
  ensureDir: typeof import('fs-extra').ensureDir
  ensureDirSync: typeof import('fs-extra').ensureDirSync
  ensureLink: typeof import('fs-extra').ensureLink
  ensureLinkSync: typeof import('fs-extra').ensureLinkSync
  ensureSymlink: typeof import('fs-extra').ensureSymlink
  ensureSymlinkSync: typeof import('fs-extra').ensureSymlinkSync
  mkdirp: typeof import('fs-extra').mkdirp
  mkdirpSync: typeof import('fs-extra').mkdirpSync
  mkdirs: typeof import('fs-extra').mkdirs
  outputFile: typeof import('fs-extra').outputFile
  outputFileSync: typeof import('fs-extra').outputFileSync
  outputJson: typeof import('fs-extra').outputJson
  outputJsonSync: typeof import('fs-extra').outputJsonSync
  pathExists: typeof import('fs-extra').pathExists
  pathExistsSync: typeof import('fs-extra').pathExistsSync
  readJson: typeof import('fs-extra').readJson
  readJsonSync: typeof import('fs-extra').readJsonSync
  remove: typeof import('fs-extra').remove
  removeSync: typeof import('fs-extra').removeSync
  writeJson: typeof import('fs-extra').writeJson
  writeJsonSync: typeof import('fs-extra').writeJsonSync
  move: typeof import('fs-extra').move
  moveSync: typeof import('fs-extra').moveSync
  readFile: typeof import('fs/promises').readFile
  readFileSync: typeof import('fs').readFileSync
  writeFile: typeof import('fs/promises').writeFile
  writeFileSync: typeof import('fs').writeFileSync
  appendFile: typeof import('fs/promises').appendFile
  appendFileSync: typeof import('fs').appendFileSync
  readdir: typeof import('fs/promises').readdir
  readdirSync: typeof import('fs').readdirSync
  copyFile: typeof import('fs/promises').copyFile
  copyFileSync: typeof import('fs').copyFileSync

  stat: typeof import('fs/promises').stat
  lstat: typeof import('fs/promises').lstat

  rmdir: typeof import('fs/promises').rmdir
  unlink: typeof import('fs/promises').unlink
  symlink: typeof import('fs/promises').symlink
  readlink: typeof import('fs/promises').readlink
  realpath: typeof import('fs/promises').realpath
  access: typeof import('fs/promises').access
  rename: typeof import('fs/promises').rename

  chown: typeof import('fs/promises').chown
  lchown: typeof import('fs/promises').lchown
  utimes: typeof import('fs/promises').utimes
  lutimes: typeof import('fs/promises').lutimes

  createReadStream: typeof import('fs').createReadStream
  createWriteStream: typeof import('fs').createWriteStream
  Writable: typeof import('stream').Writable
  Readable: typeof import('stream').Readable
  Duplex: typeof import('stream').Duplex
  Transform: typeof import('stream').Transform
  compile: typeof import('handlebars').compile

  md: Md
  marked: typeof import('marked').marked
  uuid: typeof import('crypto').randomUUID
  replace: typeof import('replace-in-file').replaceInFile

  //custom
  ensureReadFile: EnsureReadFile
  ensureReadJson: EnsureReadJson

  globby: typeof import('globby').globby
}