export interface CLI {
  "add-kenv-to-profile": Promise<
    typeof import("./cli/add-kenv-to-profile")
  >
  "add-kit-to-profile": Promise<
    typeof import("./cli/add-kenv-to-profile")
  >
  "app-run": Promise<typeof import("./cli/app-run")>
  "browse-examples": Promise<
    typeof import("./cli/browse-examples")
  >
  "cache-menu": Promise<typeof import("./cli/cache-menu")>
  "change-editor": Promise<
    typeof import("./cli/change-editor")
  >
  "change-main-shortcut": Promise<
    typeof import("./cli/change-main-shortcut")
  >
  "change-shortcut": Promise<
    typeof import("./cli/change-shortcut")
  >
  "check-for-update": Promise<
    typeof import("./cli/check-for-update")
  >
  "create-all-bins": Promise<
    typeof import("./cli/create-all-bins")
  >
  "create-bin": Promise<typeof import("./cli/create-bin")>
  "find-script": Promise<typeof import("./cli/find-script")>
  "get-help": Promise<typeof import("./cli/get-help")>
  "goto-docs": Promise<typeof import("./cli/goto-docs")>
  "manage-npm": Promise<typeof import("./cli/manage-npm")>
  "more-info": Promise<typeof import("./cli/more-info")>
  "new-from-template": Promise<
    typeof import("./cli/new-from-template")
  >
  "new-from-url": Promise<
    typeof import("./cli/new-from-url")
  >
  "open-at-login": Promise<
    typeof import("./cli/open-at-login")
  >
  "open-kit": Promise<typeof import("./cli/open-kit")>
  "open-log": Promise<typeof import("./cli/open-log")>
  "set-env-var": Promise<typeof import("./cli/set-env-var")>
  "share-copy": Promise<typeof import("./cli/share-copy")>
  "share-script-as-discussion": Promise<
    typeof import("./cli/share-script-as-discussion")
  >
  "share-script-as-link": Promise<
    typeof import("./cli/share-script-as-link")
  >
  "share-script": Promise<
    typeof import("./cli/share-script")
  >
  "stream-deck": Promise<typeof import("./cli/stream-deck")>
  "system-events": Promise<
    typeof import("./cli/system-events")
  >

  background: Promise<typeof import("./cli/background")>
  browse: Promise<typeof import("./cli/browse")>
  clear: Promise<typeof import("./cli/clear")>
  clipboard: Promise<typeof import("./cli/clipboard")>
  credits: Promise<typeof import("./cli/credits")>
  duplicate: Promise<typeof import("./cli/duplicate")>
  edit: Promise<typeof import("./cli/edit")>
  env: Promise<typeof import("./cli/env")>
  exists: Promise<typeof import("./cli/exists")>
  fns: Promise<typeof import("./cli/fns")>
  info: Promise<typeof import("./cli/info")>
  install: Promise<typeof import("./cli/install")>
  issue: Promise<typeof import("./cli/issue")>
  join: Promise<typeof import("./cli/join")>
  kit: Promise<typeof import("./cli/kit")>
  menu: Promise<typeof import("./cli/menu")>
  new: Promise<typeof import("./cli/new")>
  open: Promise<typeof import("./cli/open")>
  quit: Promise<typeof import("./cli/quit")>
  remove: Promise<typeof import("./cli/remove")>
  rename: Promise<typeof import("./cli/rename")>
  run: Promise<typeof import("./cli/run")>
  schedule: Promise<typeof import("./cli/schedule")>
  scripts: Promise<typeof import("./cli/scripts")>
  sdk: Promise<typeof import("./cli/sdk")>
  settings: Promise<typeof import("./cli/settings")>
  share: Promise<typeof import("./cli/share")>
  tutorial: Promise<typeof import("./cli/tutorial")>
  uninstall: Promise<typeof import("./cli/uninstall")>
  update: Promise<typeof import("./cli/update")>
}
