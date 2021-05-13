export interface Lib {
  audio: Promise<typeof import("./lib/audio")>
  chrome: Promise<typeof import("./lib/chrome")>
  desktop: Promise<typeof import("./lib/desktop")>
  file: Promise<typeof import("./lib/file")>
  index: Promise<typeof import("./lib/index")>
  keyboard: Promise<typeof import("./lib/keyboard")>
  playwright: Promise<typeof import("./lib/playwright")>
  speech: Promise<typeof import("./lib/speech")>
  system: Promise<typeof import("./lib/system")>
  text: Promise<typeof import("./lib/text")>
}
