export {}
import * as shelljs from "shelljs"
import {
  add,
  clone,
  commit,
  pull,
  push,
} from "isomorphic-git"

export type Trash = typeof import("trash").default
export type Git = {
  clone: (
    repo: string,
    dir: string
  ) => ReturnType<typeof clone>
  pull: (dir: string) => ReturnType<typeof pull>
  push: (dir: string) => ReturnType<typeof push>
  add: (dir: string, glob: string) => ReturnType<typeof add>
  commit: (
    dir: string,
    message: string
  ) => ReturnType<typeof commit>
}
export type Open = typeof import("open")

type NodeNotify = typeof import("node-notifier").notify
export interface Notify {
  (...args: Parameters<NodeNotify>): ReturnType<NodeNotify>
}

export interface OnTab {
  (name: string, fn: () => void): void
}

export interface PackagesApi {
  cd: typeof import("zx").cd
  cp: typeof shelljs.cp
  chmod: typeof shelljs.chmod
  echo: typeof shelljs.echo
  exit: typeof shelljs.exit
  grep: typeof shelljs.grep
  ln: typeof shelljs.ln
  ls: typeof shelljs.ls
  mkdir: typeof shelljs.mkdir
  mv: typeof shelljs.mv
  sed: typeof shelljs.sed
  tempdir: typeof shelljs.tempdir
  test: typeof shelljs.test
  which: typeof shelljs.which
  paste: () => Promise<string>
  copy: (text: string) => Promise<void>
  trash: Trash
  open: Open
  rm: Trash
  notify: Notify

  $: typeof import("zx").$
}

declare global {
  var cd: typeof import("zx").cd
  var cp: typeof shelljs.cp
  var chmod: typeof shelljs.chmod
  var echo: typeof shelljs.echo
  var exit: typeof shelljs.exit
  var grep: typeof shelljs.grep
  var ln: typeof shelljs.ln
  var ls: typeof shelljs.ls
  var mkdir: typeof shelljs.mkdir
  var mv: typeof shelljs.mv
  var pwd: typeof shelljs.pwd
  var sed: typeof shelljs.sed
  var tempdir: typeof shelljs.tempdir
  var test: typeof shelljs.test
  var which: typeof shelljs.which

  var paste: () => Promise<string>
  var copy: (text: string) => Promise<void>

  var trash: Trash
  var open: Open
  var rm: Trash
  var git: Git

  var notify: Notify

  var memoryMap: Map<string, any>

  var onTabIndex: number

  var $: typeof import("zx").$
}
