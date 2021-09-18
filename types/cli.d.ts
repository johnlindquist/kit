export interface CLI {
  "add-kenv-to-profile": Promise<
    typeof import("../src/cli/add-kenv-to-profile")
  >
  "add-kit-to-profile": Promise<
    typeof import("../src/cli/add-kenv-to-profile")
  >
  "app-run": Promise<typeof import("../src/cli/app-run")>
  "browse-examples": Promise<
    typeof import("../src/cli/browse-examples")
  >
  "refresh-scripts-db": Promise<
    typeof import("../src/cli/refresh-scripts-db")
  >
  "change-editor": Promise<
    typeof import("../src/cli/change-editor")
  >
  "change-main-shortcut": Promise<
    typeof import("../src/cli/change-main-shortcut")
  >
  "change-shortcut": Promise<
    typeof import("../src/cli/change-shortcut")
  >
  "create-all-bins": Promise<
    typeof import("../src/cli/create-all-bins")
  >
  "create-bin": Promise<
    typeof import("../src/cli/create-bin")
  >
  "edit-file": Promise<
    typeof import("../src/cli/edit-file")
  >
  "kenv-create": Promise<
    typeof import("../src/cli/kenv-create")
  >
  "get-help": Promise<typeof import("../src/cli/get-help")>
  "goto-docs": Promise<
    typeof import("../src/cli/goto-docs")
  >
  "manage-npm": Promise<
    typeof import("../src/cli/manage-npm")
  >
  "more-info": Promise<
    typeof import("../src/cli/more-info")
  >
  "new-from-template": Promise<
    typeof import("../src/cli/new-from-template")
  >
  "new-from-url": Promise<
    typeof import("../src/cli/new-from-url")
  >
  "open-at-login": Promise<
    typeof import("../src/cli/open-at-login")
  >
  "open-command-log": Promise<
    typeof import("../src/cli/open-command-log")
  >
  "open-kit": Promise<typeof import("../src/cli/open-kit")>
  "kit-clear-prompt": Promise<
    typeof import("../src/cli/kit-clear-prompt")
  >
  "open-kenv": Promise<
    typeof import("../src/cli/open-kenv")
  >
  "open-log": Promise<typeof import("../src/cli/open-log")>
  "set-env-var": Promise<
    typeof import("../src/cli/set-env-var")
  >
  "search-docs": Promise<
    typeof import("../src/cli/search-docs")
  >
  "share-copy": Promise<
    typeof import("../src/cli/share-copy")
  >
  "share-script-as-discussion": Promise<
    typeof import("../src/cli/share-script-as-discussion")
  >
  "share-script-as-link": Promise<
    typeof import("../src/cli/share-script-as-link")
  >
  "share-script": Promise<
    typeof import("../src/cli/share-script")
  >
  "stream-deck": Promise<
    typeof import("../src/cli/stream-deck")
  >
  "kenv-switch": Promise<
    typeof import("../src/cli/kenv-switch")
  >
  "kenv-clone": Promise<
    typeof import("../src/cli/kenv-clone")
  >
  "kenv-view": Promise<
    typeof import("../src/cli/kenv-view")
  >
  "kit-log": Promise<typeof import("../src/cli/kit-log")>
  "kenv-rm": Promise<typeof import("../src/cli/kenv-rm")>
  "kenv-pull": Promise<
    typeof import("../src/cli/kenv-pull")
  >
  "kenv-push": Promise<
    typeof import("../src/cli/kenv-push")
  >
  "system-events": Promise<
    typeof import("../src/cli/system-events")
  >

  background: Promise<
    typeof import("../src/cli/background")
  >
  browse: Promise<typeof import("../src/cli/browse")>
  clear: Promise<typeof import("../src/cli/clear")>
  credits: Promise<typeof import("../src/cli/credits")>
  ["kenv-create"]: Promise<
    typeof import("../src/cli/kenv-create")
  >
  ["kenv-add"]: Promise<
    typeof import("../src/cli/kenv-add")
  >
  duplicate: Promise<typeof import("../src/cli/duplicate")>
  edit: Promise<typeof import("../src/cli/edit")>
  env: Promise<typeof import("../src/cli/env")>
  exists: Promise<typeof import("../src/cli/exists")>
  install: Promise<typeof import("../src/cli/install")>
  issue: Promise<typeof import("../src/cli/issue")>
  join: Promise<typeof import("../src/cli/join")>
  kit: Promise<typeof import("../src/cli/kit")>
  new: Promise<typeof import("../src/cli/new")>
  open: Promise<typeof import("../src/cli/open")>
  prefs: Promise<typeof import("../src/cli/prefs")>
  quit: Promise<typeof import("../src/cli/quit")>
  remove: Promise<typeof import("../src/cli/remove")>
  move: Promise<typeof import("../src/cli/move")>
  rename: Promise<typeof import("../src/cli/rename")>
  run: Promise<typeof import("../src/cli/run")>
  schedule: Promise<typeof import("../src/cli/schedule")>
  sdk: Promise<typeof import("../src/cli/sdk")>
  share: Promise<typeof import("../src/cli/share")>
  ["kenv-switch"]: Promise<
    typeof import("../src/cli/kenv-switch")
  >
  tutorial: Promise<typeof import("../src/cli/tutorial")>
  uninstall: Promise<typeof import("../src/cli/uninstall")>
  update: Promise<typeof import("../src/cli/update")>
}

interface CliModuleLoader {
  (
    packageName: keyof CLI,
    ...moduleArgs: string[]
  ): Promise<any>
}

interface CliApi {
  cli: CliModuleLoader
}

declare global {
  namespace NodeJS {
    interface Global extends CliApi {}
  }

  var cli: CliModuleLoader
}
