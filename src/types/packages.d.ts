import type * as shelljs from "shelljs/index"
import type {
	add,
	clone,
	commit,
	init,
	pull,
	push,
	addRemote
} from "isomorphic-git"

export type Trash = (
	input: string | readonly string[],
	option?: {
		glob?: boolean
	}
) => Promise<void>

export type Git = {
	clone: (
		repo: string,
		dir: string,
		options?: Partial<Parameters<typeof clone>[0]>
	) => ReturnType<typeof clone>
	pull: (
		dir: string,
		options?: Partial<Parameters<typeof pull>[0]>
	) => ReturnType<typeof pull>
	push: (
		dir: string,
		options?: Partial<Parameters<typeof push>[0]>
	) => ReturnType<typeof push>
	add: (
		dir: string,
		glob: string,
		options?: Partial<Parameters<typeof add>[0]>
	) => ReturnType<typeof add>
	commit: (
		dir: string,
		message: string,
		options?: Partial<Parameters<typeof commit>[0]>
	) => ReturnType<typeof commit>
	init: (
		dir: string,
		options?: Partial<Parameters<typeof init>[0]>
	) => ReturnType<typeof init>
	addRemote: (
		dir: string,
		remote: string,
		url: string,
		options?: Partial<Parameters<typeof addRemote>[0]>
	) => ReturnType<typeof addRemote>
}
export type Open = typeof import("open/index").default
export type OpenApp = typeof import("open/index").openApp

export type OnTab = (name: string, fn: () => void) => void

export type TmpPromise = typeof import("tmp-promise")

export type Zx = typeof import("zx/build/index")

export interface PackagesApi {
	cd: Zx["cd"]
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

	$: Zx["$"]
}

export interface DegitOptions {
	force?: boolean
}

export interface IDegit {
	repo: string
	subdirectory: string | undefined
	ref: string | undefined
	options: DegitOptions

	clone(dest: string): Promise<void>
}
type Degit = (repo: string, options?: DegitOptions) => IDegit

declare global {
	var cd: Zx["cd"]
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
	var openApp: OpenApp
	var rm: Trash
	var git: Git
	var degit: Degit
	var tmpPromise: TmpPromise
	var memoryMap: Map<string, any>

	var onTabIndex: number

	var $: Zx["$"]
}
