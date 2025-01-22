type ReadFileOptions = Parameters<typeof import('node:fs/promises').readFile>[1]

export type EnsureReadFile = (path: string, defaultContent?: string, options?: ReadFileOptions) => Promise<string>

export type EnsureReadJson = 
  <T>(path: string, defaultContent: T, options?: Parameters<typeof import('fs-extra').readJson>[1]) => Promise<T>


declare global {
    //process
    var cwd: typeof process.cwd
    var pid: typeof process.pid
    var stderr: typeof process.stderr
    var stdin: typeof process.stdin
    var stdout: typeof process.stdout
    var uptime: typeof process.uptime
    //axios
    var get: import('axios').AxiosInstance['get']
    var put: import('axios').AxiosInstance['put']
    var post: import('axios').AxiosInstance['post']
    var patch: import('axios').AxiosInstance['patch']
    //chalk
    var chalk: typeof import('chalk').default
    //child_process
    var spawn: typeof import('child_process').spawn
    var spawnSync: typeof import('child_process').spawnSync
    var fork: typeof import('child_process').fork
  
    // custom
    var ensureReadFile: EnsureReadFile
    var ensureReadJson: EnsureReadJson
    // execa
    var exec: typeof import('execa').execaCommand
    var execa: typeof import('execa').execa
    var execaSync: typeof import('execa').execaSync
    var execaCommand: typeof import('execa').execaCommand
    var execaCommandSync: typeof import('execa').execaCommandSync
    var execaNode: typeof import('execa').execaNode
    var $: typeof import('execa').$
    //download
    var download: typeof import('download')
    //fs-extra
    var emptyDir: typeof import('fs-extra').emptyDir
    var emptyDirSync: typeof import('fs-extra').emptyDirSync
    var ensureFile: typeof import('fs-extra').ensureFile
    var ensureFileSync: typeof import('fs-extra').ensureFileSync
    var ensureDir: typeof import('fs-extra').ensureDir
    var ensureDirSync: typeof import('fs-extra').ensureDirSync
    var ensureLink: typeof import('fs-extra').ensureLink
    var ensureLinkSync: typeof import('fs-extra').ensureLinkSync
    var ensureSymlink: typeof import('fs-extra').ensureSymlink
    var ensureSymlinkSync: typeof import('fs-extra').ensureSymlinkSync
    var mkdirp: typeof import('fs-extra').mkdirp
    var mkdirpSync: typeof import('fs-extra').mkdirpSync
    var mkdirs: typeof import('fs-extra').mkdirs
    var outputFile: typeof import('fs-extra').outputFile
    var outputFileSync: typeof import('fs-extra').outputFileSync
    var outputJson: typeof import('fs-extra').outputJson
    var outputJsonSync: typeof import('fs-extra').outputJsonSync
    var pathExists: typeof import('fs-extra').pathExists
    var pathExistsSync: typeof import('fs-extra').pathExistsSync
    var readJson: typeof import('fs-extra').readJson
    var readJsonSync: typeof import('fs-extra').readJsonSync
    var remove: typeof import('fs-extra').remove
    var removeSync: typeof import('fs-extra').removeSync
    var writeJson: typeof import('fs-extra').writeJson
    var writeJsonSync: typeof import('fs-extra').writeJsonSync
    var move: typeof import('fs-extra').move
    var moveSync: typeof import('fs-extra').moveSync
    //fs/promises
    var readFile: typeof import('node:fs/promises').readFile
    var readFileSync: typeof import('node:fs').readFileSync
    var writeFile: typeof import('node:fs/promises').writeFile
    var writeFileSync: typeof import('node:fs').writeFileSync
    var appendFile: typeof import('node:fs/promises').appendFile
    var appendFileSync: typeof import('node:fs').appendFileSync
    var readdir: typeof import('node:fs/promises').readdir
    var readdirSync: typeof import('node:fs').readdirSync
    var copyFile: typeof import('node:fs/promises').copyFile
    var copyFileSync: typeof import('node:fs').copyFileSync
  
    var stat: typeof import('node:fs/promises').stat
    var lstat: typeof import('node:fs/promises').lstat
  
    var rmdir: typeof import('node:fs/promises').rmdir
    var unlink: typeof import('node:fs/promises').unlink
    var symlink: typeof import('node:fs/promises').symlink
    var readlink: typeof import('node:fs/promises').readlink
    var realpath: typeof import('node:fs/promises').realpath
    var access: typeof import('node:fs/promises').access
  
    var chown: typeof import('fs/promises').chown
    var lchown: typeof import('node:fs/promises').lchown
    var utimes: typeof import('node:fs/promises').utimes
    var lutimes: typeof import('node:fs/promises').lutimes
  
    var rename: typeof import('node:fs/promises').rename
  
    //fs
    var createReadStream: typeof import('fs').createReadStream
    var createWriteStream: typeof import('fs').createWriteStream
  
    //handlebars
    var compile: typeof import('handlebars').compile
  
    //marked
    var md: typeof import('../globals/marked').md
    var marked: typeof import('marked').marked
    //uuid
    var uuid: typeof import('node:crypto').randomUUID
  
    //replace-in-file
    var replace: typeof import('replace-in-file').replaceInFile
    // stream
    var Writable: typeof import('node:stream').Writable
    var Readable: typeof import('node:stream').Readable
    var Duplex: typeof import('node:stream').Duplex
    var Transform: typeof import('node:stream').Transform
  
    var globby: typeof import('globby').globby
  }
  