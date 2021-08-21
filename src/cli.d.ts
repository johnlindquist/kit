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
  "refresh-scripts-db": Promise<
    typeof import("./cli/refresh-scripts-db")
  >
  "change-editor": Promise<
    typeof import("./cli/change-editor")
  >
  "change-main-shortcut": Promise<
    typeof import("./cli/change-main-shortcut")
  >
  "change-shortcut": Promise<
    typeof import("./cli/change-shortcut")
  >
  "create-all-bins": Promise<
    typeof import("./cli/create-all-bins")
  >
  "create-bin": Promise<typeof import("./cli/create-bin")>
  "edit-file": Promise<typeof import("./cli/edit-file")>
  "kenv-create": Promise<typeof import("./cli/kenv-create")>
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
  "open-command-log": Promise<
    typeof import("./cli/open-command-log")
  >
  "open-kit": Promise<typeof import("./cli/open-kit")>
  "kit-clear-prompt": Promise<
    typeof import("./cli/kit-clear-prompt")
  >
  "open-kenv": Promise<typeof import("./cli/open-kenv")>
  "open-log": Promise<typeof import("./cli/open-log")>
  "set-env-var": Promise<typeof import("./cli/set-env-var")>
  "search-docs": Promise<typeof import("./cli/search-docs")>
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
  "kenv-switch": Promise<typeof import("./cli/kenv-switch")>
  "kenv-clone": Promise<typeof import("./cli/kenv-clone")>
  "kenv-view": Promise<typeof import("./cli/kenv-view")>
  "kit-log": Promise<typeof import("./cli/kit-log")>
  "kenv-rm": Promise<typeof import("./cli/kenv-rm")>
  "kenv-pull": Promise<typeof import("./cli/kenv-pull")>
  "kenv-push": Promise<typeof import("./cli/kenv-push")>
  "system-events": Promise<
    typeof import("./cli/system-events")
  >

  background: Promise<typeof import("./cli/background")>
  browse: Promise<typeof import("./cli/browse")>
  clear: Promise<typeof import("./cli/clear")>
  credits: Promise<typeof import("./cli/credits")>
  ["kenv-create"]: Promise<
    typeof import("./cli/kenv-create")
  >
  ["kenv-add"]: Promise<typeof import("./cli/kenv-add")>
  duplicate: Promise<typeof import("./cli/duplicate")>
  edit: Promise<typeof import("./cli/edit")>
  env: Promise<typeof import("./cli/env")>
  exists: Promise<typeof import("./cli/exists")>
  install: Promise<typeof import("./cli/install")>
  issue: Promise<typeof import("./cli/issue")>
  join: Promise<typeof import("./cli/join")>
  kit: Promise<typeof import("./cli/kit")>
  new: Promise<typeof import("./cli/new")>
  open: Promise<typeof import("./cli/open")>
  prefs: Promise<typeof import("./cli/prefs")>
  quit: Promise<typeof import("./cli/quit")>
  remove: Promise<typeof import("./cli/remove")>
  move: Promise<typeof import("./cli/move")>
  rename: Promise<typeof import("./cli/rename")>
  run: Promise<typeof import("./cli/run")>
  schedule: Promise<typeof import("./cli/schedule")>
  sdk: Promise<typeof import("./cli/sdk")>
  share: Promise<typeof import("./cli/share")>
  ["kenv-switch"]: Promise<
    typeof import("./cli/kenv-switch")
  >
  tutorial: Promise<typeof import("./cli/tutorial")>
  uninstall: Promise<typeof import("./cli/uninstall")>
  update: Promise<typeof import("./cli/update")>
}
