export interface Lib {
  audio: Promise<typeof import("../src/lib/audio")>
  chrome: Promise<typeof import("../src/lib/browser")>
  desktop: Promise<typeof import("../src/lib/desktop")>
  file: Promise<typeof import("../src/lib/file")>
  keyboard: Promise<typeof import("../src/lib/keyboard")>
  playwright: Promise<typeof import("../src/lib/browser")>
  speech: Promise<typeof import("../src/lib/speech")>
  system: Promise<typeof import("../src/lib/system")>
  text: Promise<typeof import("../src/lib/text")>
}

interface LibModuleLoader {
  (
    packageName: keyof Lib,
    ...moduleArgs: string[]
  ): Promise<any>
}

interface LibApi {
  copyPathAsImage: typeof import("lib/file").copyPathAsImage
  fileSearch: typeof import("lib/file").fileSearch
  focusTab: typeof import("lib/browser").focusTab
  focusWindow: typeof import("lib/desktop").focusWindow
  getActiveAppBounds: typeof import("lib/desktop").getActiveAppBounds
  getActiveScreen: typeof import("lib/desktop").getActiveScreen
  getActiveTab: typeof import("lib/browser").getActiveTab
  getMousePosition: typeof import("lib/desktop").getMousePosition
  getScreens: typeof import("lib/desktop").getScreens
  getSelectedFile: typeof import("lib/file").getSelectedFile
  getSelectedText: typeof import("lib/text").getSelectedText
  getTabs: typeof import("lib/browser").getTabs
  getWindows: typeof import("lib/desktop").getWindows
  getWindowsBounds: typeof import("lib/desktop").getWindowsBounds
  lock: typeof import("lib/system").lock
  organizeWindows: typeof import("lib/desktop").organizeWindows
  playAudioFile: typeof import("lib/audio").playAudioFile
  quitAllApps: typeof import("lib/system").quitAllApps
  say: typeof import("lib/speech").say
  scatterWindows: typeof import("lib/desktop").scatterWindows
  setActiveAppBounds: typeof import("lib/desktop").setActiveAppBounds
  setSelectedText: typeof import("lib/text").setSelectedText
  setWindowBoundsByIndex: typeof import("lib/desktop").setWindowBoundsByIndex
  setWindowPosition: typeof import("lib/desktop").setWindowPosition
  setWindowPositionByIndex: typeof import("lib/desktop").setWindowPositionByIndex
  setWindowSize: typeof import("lib/desktop").setWindowSize
  setWindowSizeByIndex: typeof import("lib/desktop").setWindowSizeByIndex
  keystroke: typeof import("lib/keyboard").keystroke
  shutdown: typeof import("lib/system").shutdown
  sleep: typeof import("lib/system").sleep
  tileWindow: typeof import("lib/desktop").tileWindow
  scrapeSelector: typeof import("lib/browser").scrapeSelector
  scrapeAttribute: typeof import("lib/browser").scrapeAttribute
}

declare global {
  namespace NodeJS {
    interface Global extends LibApi {}
  }

  var copyPathAsImage: typeof import("lib/file").copyPathAsImage
  var fileSearch: typeof import("lib/file").fileSearch
  var focusTab: typeof import("lib/browser").focusTab
  var focusWindow: typeof import("lib/desktop").focusWindow
  var getActiveAppBounds: typeof import("lib/desktop").getActiveAppBounds
  var getActiveScreen: typeof import("lib/desktop").getActiveScreen
  var getActiveTab: typeof import("lib/browser").getActiveTab
  var getMousePosition: typeof import("lib/desktop").getMousePosition
  var getScreens: typeof import("lib/desktop").getScreens
  var getSelectedFile: typeof import("lib/file").getSelectedFile
  var getSelectedText: typeof import("lib/text").getSelectedText
  var getTabs: typeof import("lib/browser").getTabs
  var getWindows: typeof import("lib/desktop").getWindows
  var getWindowsBounds: typeof import("lib/desktop").getWindowsBounds
  var lock: typeof import("lib/system").lock
  var organizeWindows: typeof import("lib/desktop").organizeWindows
  var playAudioFile: typeof import("lib/audio").playAudioFile
  var quitAllApps: typeof import("lib/system").quitAllApps
  var say: typeof import("lib/speech").say
  var scatterWindows: typeof import("lib/desktop").scatterWindows
  var setActiveAppBounds: typeof import("lib/desktop").setActiveAppBounds
  var setSelectedText: typeof import("lib/text").setSelectedText
  var setWindowBoundsByIndex: typeof import("lib/desktop").setWindowBoundsByIndex
  var setWindowPosition: typeof import("lib/desktop").setWindowPosition
  var setWindowPositionByIndex: typeof import("lib/desktop").setWindowPositionByIndex
  var setWindowSize: typeof import("lib/desktop").setWindowSize
  var setWindowSizeByIndex: typeof import("lib/desktop").setWindowSizeByIndex
  var keystroke: typeof import("lib/keyboard").keystroke
  var shutdown: typeof import("lib/system").shutdown
  var sleep: typeof import("lib/system").sleep
  var tileWindow: typeof import("lib/desktop").tileWindow
  var scrapeSelector: typeof import("lib/browser").scrapeSelector
  var scrapeAttribute: typeof import("lib/browser").scrapeAttribute
}
