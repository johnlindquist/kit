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
export type Open = typeof import("open").default
export type OpenApp = typeof import("open").openApp

export type OnTab = (name: string, fn: () => void) => void

export type TmpPromise = typeof import("tmp-promise")

export interface PackagesApi {
	cd: typeof shelljs.cd
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
	var cd: typeof shelljs.cd
	var cp: typeof shelljs.cp
	var chmod: typeof shelljs.chmod
	var echo: typeof shelljs.echo
	/**
	 * Exit the script completely
	 * #### exit example
	 * ```ts
	 * // Prevent the script from running for more than 1 second
	 * setTimeout(() => {
	 *   exit();
	 * }, 1000);
	 * await arg("I will exit in 1 second");
	 * ```
	 [Examples](https://scriptkit.com?query=exit) | [Docs](https://johnlindquist.github.io/kit-docs/#exit) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=exit)
	 */
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

	/**
	 * Moves files or directories to the trash.
	 * - Only tested on macOS
	 * - May require additional permissions or configurations
	 * #### trash example
	 * ```ts
	 * await trash("/path/to/file.txt")
	 * ```
	 [Examples](https://scriptkit.com?query=trash) | [Docs](https://johnlindquist.github.io/kit-docs/#trash) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=trash)
	 */
	var trash: Trash
	var open: Open
	/**
	 * Opens an application.
	 * - Only tested on macOS
	 * - May require additional permissions or configurations
	 * #### openApp example
	 * ```ts
	 * await openApp("Google Chrome")
	 * ```
	 [Examples](https://scriptkit.com?query=openApp) | [Docs](https://johnlindquist.github.io/kit-docs/#openApp) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=openApp)
	 */
	var openApp: OpenApp
	var rm: Trash
	/**
	 * Git utility functions.
	 * - Only tested on macOS
	 * - May require additional permissions or configurations
	 * #### git example
	 * ```ts
	 * await git.clone("https://github.com/user/repo.git", "/path/to/repo")
	 * ```
	 [Examples](https://scriptkit.com?query=git) | [Docs](https://johnlindquist.github.io/kit-docs/#git) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=git)
	 */
	var git: Git
	/**
	 * Clones a GitHub repository using degit.
	 * - Only tested on macOS
	 * - May require additional permissions or configurations
	 * #### degit example
	 * ```ts
	 * await degit("https://github.com/user/repo.git", "/path/to/repo")
	 * ```
	 [Examples](https://scriptkit.com?query=degit) | [Docs](https://johnlindquist.github.io/kit-docs/#degit) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=degit)
	 */
	var degit: Degit
	var tmpPromise: TmpPromise
	/**
	 * Manages a memory map of objects.
	 * #### memoryMap example
	 * ```ts
	 * memoryMap.set("myKey", { myObject: true })
	 * let value = memoryMap.get("myKey")
	 * ```
	 [Examples](https://scriptkit.com?query=memoryMap) | [Docs](https://johnlindquist.github.io/kit-docs/#memoryMap) | [Discussions](https://github.com/johnlindquist/kit/discussions?discussions_q=memoryMap)
	 */
	var memoryMap: Map<string, any>

	var onTabIndex: number
}
