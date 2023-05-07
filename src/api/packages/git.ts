import _git from "isomorphic-git"
import fs from "fs"
import http from "isomorphic-git/http/node/index.js"

let gitClone = async (
  repo: string,
  dir: string,
  options?: Parameters<typeof _git.clone>[0]
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
  options?: Parameters<typeof _git.pull>[0]
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
  options?: Parameters<typeof _git.push>[0]
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
  options?: Parameters<typeof _git.add>[0]
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
  options?: Parameters<typeof _git.commit>[0]
) => {
  return await _git.commit({
    fs,
    dir,
    message,
    ...(options ? options : {}),
  })
}

global.git = {
  clone: gitClone,
  pull: gitPull,
  push: gitPush,
  add: gitAdd,
  commit: gitCommit,
}
