export interface Main {
  snippets: Promise<typeof import("../main/snippets")>
  templates: Promise<typeof import("../main/templates")>
}

export interface CLI {
  "add-kenv-to-profile": Promise<
    typeof import("./add-kenv-to-profile")
  >
  "add-kit-to-profile": Promise<
    typeof import("./add-kenv-to-profile")
  >
  "browse-examples": Promise<
    typeof import("./browse-examples")
  >
  "refresh-scripts-db": Promise<
    typeof import("./refresh-scripts-db")
  >
  "change-editor": Promise<typeof import("./change-editor")>
  "change-main-shortcut": Promise<
    typeof import("./change-main-shortcut")
  >
  "change-shortcut": Promise<
    typeof import("./change-shortcut")
  >
  "create-all-bins": Promise<
    typeof import("./create-all-bins")
  >
  "create-all-bins-no-trash": Promise<
    typeof import("./create-all-bins-no-trash")
  >
  "create-bin": Promise<typeof import("./create-bin")>
  "edit-file": Promise<typeof import("./edit-file")>
  "editor-history": Promise<
    typeof import("./editor-history")
  >
  "kenv-create": Promise<typeof import("./kenv-create")>
  "get-help": Promise<typeof import("./get-help")>
  hot: Promise<typeof import("./hot")>
  faq: Promise<typeof import("./faq")>
  "goto-docs": Promise<typeof import("./goto-docs")>
  "goto-guide": Promise<typeof import("./goto-guide")>
  tips: Promise<typeof import("./tips")>
  "kenv-change-dir": Promise<
    typeof import("./kenv-change-dir")
  >
  "manage-npm": Promise<typeof import("./manage-npm")>
  "more-info": Promise<typeof import("./more-info")>
  "new-from-clipboard": Promise<
    typeof import("./new-from-clipboard")
  >
  "new-from-template": Promise<
    typeof import("./new-from-template")
  >
  "new-from-url": Promise<typeof import("./new-from-url")>
  "open-at-login": Promise<typeof import("./open-at-login")>
  "open-command-log": Promise<
    typeof import("./open-command-log")
  >
  "open-kit": Promise<typeof import("./open-kit")>
  "kit-clear-prompt": Promise<
    typeof import("./kit-clear-prompt")
  >
  "open-kenv": Promise<typeof import("./open-kenv")>
  "open-log": Promise<typeof import("./open-log")>
  "set-env-var": Promise<typeof import("./set-env-var")>
  "search-docs": Promise<typeof import("./search-docs")>
  "view-docs": Promise<typeof import("./view-docs")>
  "share-copy": Promise<typeof import("./share-copy")>
  "share-script-as-discussion": Promise<
    typeof import("./share-script-as-discussion")
  >
  "share-script-as-link": Promise<
    typeof import("./share-script-as-link")
  >
  "share-script-as-markdown": Promise<
    typeof import("./share-script-as-markdown")
  >

  "share-script-as-kit-link": Promise<
    typeof import("./share-script-as-kit-link")
  >
  "share-script": Promise<typeof import("./share-script")>
  "stream-deck": Promise<typeof import("./stream-deck")>
  "kenv-switch": Promise<typeof import("./kenv-switch")>
  "kenv-clone": Promise<typeof import("./kenv-clone")>
  "kenv-term": Promise<typeof import("./kenv-term")>
  "kenv-trust": Promise<typeof import("./kenv-trust")>
  "kenv-distrust": Promise<typeof import("./kenv-distrust")>
  "kenv-view": Promise<typeof import("./kenv-view")>
  "kit-log": Promise<typeof import("./kit-log")>
  "kenv-rm": Promise<typeof import("./kenv-rm")>
  "kenv-pull": Promise<typeof import("./kenv-pull")>
  "kenv-push": Promise<typeof import("./kenv-push")>
  "kenv-visit": Promise<typeof import("./kenv-visit")>
  settings: Promise<typeof import("./settings")>
  "switch-to-js": Promise<typeof import("./switch-to-js")>
  "switch-to-ts": Promise<typeof import("./switch-to-ts")>
  "system-events": Promise<typeof import("./system-events")>

  background: Promise<typeof import("./background")>
  browse: Promise<typeof import("./browse")>
  clear: Promise<typeof import("./clear")>
  credits: Promise<typeof import("./credits")>
  ["kenv-create"]: Promise<typeof import("./kenv-create")>
  ["kenv-add"]: Promise<typeof import("./kenv-add")>
  ["kenv-manage"]: Promise<typeof import("./kenv-manage")>
  duplicate: Promise<typeof import("./duplicate")>
  edit: Promise<typeof import("./edit")>
  env: Promise<typeof import("./env")>
  exists: Promise<typeof import("./exists")>
  install: Promise<typeof import("./install")>
  issue: Promise<typeof import("./issue")>
  join: Promise<typeof import("../help/join")>
  kit: Promise<typeof import("./kit")>
  new: Promise<typeof import("./new")>
  open: Promise<typeof import("./open")>
  prefs: Promise<typeof import("./prefs")>
  processes: Promise<typeof import("./processes")>
  quit: Promise<typeof import("./quit")>
  remove: Promise<typeof import("./remove")>
  move: Promise<typeof import("./move")>
  rename: Promise<typeof import("./rename")>
  reveal: Promise<typeof import("./reveal")>
  run: Promise<typeof import("./run")>
  schedule: Promise<typeof import("./schedule")>
  sdk: Promise<typeof import("./sdk")>
  share: Promise<typeof import("./share")>
  ["kenv-switch"]: Promise<typeof import("./kenv-switch")>
  ["toggle-background"]: Promise<
    typeof import("./toggle-background")
  >
  tutorial: Promise<typeof import("./tutorial")>
  uninstall: Promise<typeof import("./uninstall")>
  update: Promise<typeof import("./update")>
  ["update-kit-package"]: Promise<
    typeof import("./update-kit-package")
  >

  ["sync-path"]: Promise<typeof import("./sync-path")>
  ["sync-path-instructions"]: Promise<
    typeof import("./sync-path-instructions")
  >
  ["toggle-tray"]: Promise<typeof import("./toggle-tray")>
  ["toggle-auto-update"]: Promise<
    typeof import("./toggle-auto-update")
  >
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
  var cli: CliModuleLoader
}
