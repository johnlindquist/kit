import _git from "isomorphic-git"
import fs from "fs"
import os from "os"
import http from "isomorphic-git/http/node/index.js"
import { DegitOptions } from "../../types/packages"

let gitClone = async (
  repo: string,
  dir: string,
  options?: Partial<Parameters<typeof _git.clone>[0]>
) => {
  return await _git.clone({
    fs,
    http,
    dir,
    url: repo,
    singleBranch: true,
    depth: 1,
    ...(options ? options : {}),
  })
}

let gitPull = async (
  dir: string,
  options?: Partial<Parameters<typeof _git.pull>[0]>
) => {
  return await _git.pull({
    fs,
    http,
    dir,
    singleBranch: true,
    ...(options ? options : {}),
  })
}

let gitPush = async (
  dir: string,
  options?: Partial<Parameters<typeof _git.push>[0]>
) => {
  return await _git.push({
    fs,
    http,
    dir,
    ...(options ? options : {}),
  })
}

let gitAdd = async (
  dir: string,
  filepath: string,
  options?: Partial<Parameters<typeof _git.add>[0]>
) => {
  return await _git.add({
    fs,
    dir,
    filepath,
    ...(options ? options : {}),
  })
}

let gitCommit = async (
  dir: string,
  message: string,
  options?: Partial<Parameters<typeof _git.commit>[0]>
) => {
  return await _git.commit({
    fs,
    dir,
    message,
    ...(options ? options : {}),
  })
}

let gitInit = async (
  dir: string,
  options?: Partial<Parameters<typeof _git.init>[0]>
) => {
  return await _git.init({
    fs,
    dir,
    ...(options ? options : {}),
  })
}

let gitAddRemote = async (
  dir: string,
  remote: string,
  url: string,
  options?: Partial<Parameters<typeof _git.addRemote>[0]>
) => {
  return await _git.addRemote({
    fs,
    dir,
    remote,
    url,
    ...(options ? options : {}),
  })
}

class Degit {
  repo: string
  subdirectory: string | undefined
  ref: string | undefined
  options: DegitOptions

  constructor(repo: string, options?: DegitOptions) {
    const [repoPath, ref] = repo.split("#")
    this.ref = ref
    this.options = options || {}

    // Check if the repoPath already starts with 'http', then don't prepend 'https://github.com/'
    let fullPath = repoPath.startsWith("http")
      ? repoPath
      : `https://github.com/${repoPath}`

    // Separate the path into segments
    const segments = fullPath.split("/")

    // The first two segments will always be either ['username', 'repo'] or ['https:', '', 'github.com', 'username', 'repo']
    // So we can take those as the repository, and everything else is the subdirectory
    const repoSegments = segments.splice(
      0,
      fullPath.startsWith("http") ? 5 : 2
    )
    this.repo = repoSegments.join("/")
    this.subdirectory = segments.join("/")
  }

  async clone(dest: string) {
    const exists = await access(dest)
      .then(() => true)
      .catch(() => false)

    if (exists && this.options.force) {
      await rmdir(dest, { recursive: true })
    } else if (exists && !this.options.force) {
      throw new Error(
        `Destination directory "${dest}" already exists. Use "force: true" to override.`
      )
    }

    const tempDest = path.join(
      os.tmpdir(),
      `degit-${Date.now()}`
    )
    await fs.promises.mkdir(tempDest, { recursive: true })

    await _git.clone({
      fs,
      http,
      dir: tempDest,
      url: this.repo,
      ref: this.ref,
      singleBranch: true,
      depth: 1,
    })

    await ensureDir(path.dirname(dest))

    await fs.promises.rename(
      this.subdirectory
        ? path.join(tempDest, this.subdirectory)
        : tempDest,
      dest
    )

    // Remove .git directory if it exists
    const dotGitExists = await access(
      path.join(dest, ".git")
    )
      .then(() => true)
      .catch(() => false)
    if (dotGitExists) {
      await rmdir(path.join(dest, ".git"), {
        recursive: true,
      })
    }
  }
}

export let degit = (repo: string, options?: DegitOptions) =>
  new Degit(repo, options)

global.degit = degit

global.git = {
  clone: gitClone,
  pull: gitPull,
  push: gitPush,
  add: gitAdd,
  commit: gitCommit,
  init: gitInit,
  addRemote: gitAddRemote,
}
