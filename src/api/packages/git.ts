import _git from "isomorphic-git"
import fs from "fs"
import http from "isomorphic-git/http/node/index.js"

let gitClone = async (repo: string, dir: string) => {
  return await _git.clone({
    fs,
    http,
    dir,
    url: repo,
    singleBranch: true,
    depth: 1,
  })
}

let gitPull = async (dir: string) => {
  return await _git.pull({
    fs,
    http,
    dir,
    singleBranch: true,
  })
}

let gitPush = async (dir: string) => {
  return await _git.push({
    fs,
    http,
    dir,
  })
}

let gitAdd = async (dir: string, filepath: string) => {
  return await _git.add({
    fs,
    dir,
    filepath,
  })
}

let gitCommit = async (dir: string, message: string) => {
  return await _git.commit({
    fs,
    dir,
    message,
  })
}

global.git = {
  clone: gitClone,
  pull: gitPull,
  push: gitPush,
  add: gitAdd,
  commit: gitCommit,
}
